"""Cost-basis engine: lot tracking and disposal matching, FIFO and LIFO.

Decided 2026-07-28 to build this properly rather than the "basic tax estimates" the planning
documents asked for. Before this, /tax returned a hardcoded structure and there was no lot
tracking anywhere.

Four properties are load-bearing, and each exists because getting it wrong is silent:

  Decimal, never float. Binary floats cannot represent 0.1, and the error compounds across
  many lots. This output is what someone files taxes from.

  Timestamp ordering, applied not assumed. Disposals consume lots in chronological order; the
  same transactions supplied out of order would consume different lots and produce a different
  realised gain, with no indication anything was wrong.

  Over-disposal raises. Disposing more than was acquired means the history is incomplete.
  Treating the missing basis as zero maximises the reported gain — being wrong in the user's
  disfavour, quietly, on a tax figure.

  Pure. No network, no clock. That is what makes this exactly testable rather than
  approximately testable.

Out of scope, and stated so in the response: wash sales, jurisdiction-specific rules, and
Form 8949 generation. "Real engine" means the arithmetic is correct and auditable, not that it
constitutes tax advice.
"""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Dict, Iterable, List, Optional

FIFO = "fifo"
LIFO = "lifo"
METHODS = (FIFO, LIFO)

# One year. Held longer than this is long-term in most jurisdictions; we report the number of
# days and the flag, and leave the rate to the filer.
LONG_TERM_DAYS = 365


class InsufficientLots(Exception):
    """A disposal exceeds the quantity acquired.

    Carries the shortfall so the caller can say which asset and how much is missing, rather
    than reporting a gain computed from a basis that was never established.
    """

    def __init__(self, asset: str, requested: Decimal, available: Decimal):
        self.asset = asset
        self.requested = requested
        self.available = available
        self.shortfall = requested - available
        super().__init__(
            f"Cannot dispose {requested} {asset.upper()}: only {available} acquired. "
            f"Short by {self.shortfall}. Transaction history is incomplete."
        )


@dataclass
class Lot:
    """One acquisition."""

    asset: str
    quantity: Decimal
    unit_cost: Decimal
    timestamp: datetime
    source: str = "unknown"
    remaining: Decimal = field(init=False)

    def __post_init__(self):
        self.quantity = _dec(self.quantity)
        self.unit_cost = _dec(self.unit_cost)
        self.remaining = self.quantity

    @property
    def cost_basis(self) -> Decimal:
        return self.quantity * self.unit_cost


@dataclass
class Disposal:
    """One sale or spend."""

    asset: str
    quantity: Decimal
    unit_price: Decimal
    timestamp: datetime
    fee: Decimal = Decimal("0")
    source: str = "unknown"

    def __post_init__(self):
        self.quantity = _dec(self.quantity)
        self.unit_price = _dec(self.unit_price)
        self.fee = _dec(self.fee)


def _dec(value) -> Decimal:
    """Coerce to Decimal via str.

    Decimal(0.1) captures the float's representation error; Decimal("0.1") does not. Callers
    pass floats from JSON, so the conversion has to go through str.
    """
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def match_disposals(
    lots: Iterable[Lot],
    disposals: Iterable[Disposal],
    method: str = FIFO,
) -> Dict[str, object]:
    """Match disposals against lots and report realised and unrealised positions.

    Returns realised disposals (each naming the lots consumed), the lots still open, and the
    limitations of the calculation.
    """
    if method not in METHODS:
        raise ValueError(f"Unknown method {method!r}. Expected one of {METHODS}.")

    # Group by asset; a BTC disposal must never consume an ETH lot.
    by_asset: Dict[str, List[Lot]] = {}
    for lot in lots:
        by_asset.setdefault(lot.asset.lower(), []).append(lot)

    # Chronological within each asset. Sorting here rather than trusting input order is what
    # makes the result independent of how the caller assembled the list.
    for asset_lots in by_asset.values():
        asset_lots.sort(key=lambda lot: lot.timestamp)

    realised = []
    for disposal in sorted(disposals, key=lambda d: d.timestamp):
        realised.append(_match_one(disposal, by_asset.get(disposal.asset.lower(), []), method))

    open_lots = [
        {
            "asset": lot.asset,
            "quantity_remaining": str(lot.remaining),
            "unit_cost": str(lot.unit_cost),
            "cost_basis_remaining": str(lot.remaining * lot.unit_cost),
            "acquired": lot.timestamp.isoformat(),
            "source": lot.source,
        }
        for asset_lots in by_asset.values()
        for lot in asset_lots
        if lot.remaining > 0
    ]

    total_gain = sum((Decimal(r["realised_gain"]) for r in realised), Decimal("0"))

    return {
        "method": method,
        "disposals": realised,
        "open_lots": open_lots,
        "total_realised_gain": str(total_gain),
        "limitations": [
            "Wash sales are not identified.",
            "No jurisdiction-specific rules are applied.",
            "Form 8949 is not generated.",
            "This is a calculation, not tax advice.",
        ],
    }


def _match_one(disposal: Disposal, asset_lots: List[Lot], method: str) -> Dict[str, object]:
    """Consume lots for a single disposal, in the order the method dictates."""
    available = sum((lot.remaining for lot in asset_lots), Decimal("0"))
    if disposal.quantity > available:
        raise InsufficientLots(disposal.asset, disposal.quantity, available)

    # Lots are held in acquisition order; LIFO simply walks them backwards.
    candidates = asset_lots if method == FIFO else list(reversed(asset_lots))

    outstanding = disposal.quantity
    consumed = []
    cost_basis = Decimal("0")

    for lot in candidates:
        if outstanding <= 0:
            break
        if lot.remaining <= 0:
            continue

        taken = min(lot.remaining, outstanding)
        lot.remaining -= taken
        outstanding -= taken
        cost_basis += taken * lot.unit_cost

        consumed.append({
            "quantity": str(taken),
            "unit_cost": str(lot.unit_cost),
            "acquired": lot.timestamp.isoformat(),
            "source": lot.source,
        })

    proceeds = disposal.quantity * disposal.unit_price - disposal.fee
    held_days = _holding_days(consumed, disposal.timestamp)

    return {
        "asset": disposal.asset,
        "quantity": str(disposal.quantity),
        "disposed_at": disposal.timestamp.isoformat(),
        "proceeds": str(proceeds),
        "cost_basis": str(cost_basis),
        "realised_gain": str(proceeds - cost_basis),
        "fee": str(disposal.fee),
        # Which lots paid for this disposal. A gain the user cannot trace to its lots cannot
        # be checked, and this is the number they file.
        "lots_consumed": consumed,
        "holding_period_days": held_days,
        "long_term": held_days is not None and held_days >= LONG_TERM_DAYS,
        "source": disposal.source,
    }


def _holding_days(consumed: List[Dict[str, object]], disposed_at: datetime) -> Optional[int]:
    """Days from the earliest consumed lot to disposal.

    A disposal spanning several lots has several holding periods; the earliest is reported, and
    `lots_consumed` carries each acquisition date for anyone needing to split the treatment.
    """
    if not consumed:
        return None

    earliest = min(datetime.fromisoformat(str(c["acquired"])) for c in consumed)
    return (disposed_at - earliest).days
