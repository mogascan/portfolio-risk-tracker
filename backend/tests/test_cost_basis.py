"""Cost-basis engine.

This is the one part of the change that can be verified exactly rather than approximately —
it is pure, deterministic, and has no network or clock — so it is tested exactly.

The worked example throughout is the one from the spec: 1 BTC bought at 30,000, then 1 BTC at
50,000, then 1 BTC sold at 60,000. FIFO realises 30,000; LIFO realises 10,000. Both are
asserted, because a stub returning a single figure for both methods would otherwise pass.
"""

from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from app.services.tax.cost_basis import (
    FIFO,
    LIFO,
    Disposal,
    InsufficientLots,
    Lot,
    match_disposals,
)

JAN = datetime(2024, 1, 1)
JUN = datetime(2024, 6, 1)
DEC = datetime(2024, 12, 1)


def btc_lots():
    return [
        Lot("btc", 1, 30000, JAN, source="coinbase"),
        Lot("btc", 1, 50000, JUN, source="kraken"),
    ]


# --------------------------------------------------------------------- FIFO vs LIFO

def test_fifo_consumes_the_oldest_lot():
    result = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)

    assert result["total_realised_gain"] == "30000"
    assert result["disposals"][0]["cost_basis"] == "30000"


def test_lifo_consumes_the_newest_lot():
    result = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=LIFO)

    assert result["total_realised_gain"] == "10000"
    assert result["disposals"][0]["cost_basis"] == "50000"


def test_the_two_methods_disagree():
    """A stub returning one figure for both would pass every test above individually."""
    disposal = [Disposal("btc", 1, 60000, DEC)]
    fifo = match_disposals(btc_lots(), disposal, method=FIFO)["total_realised_gain"]
    lifo = match_disposals(btc_lots(), disposal, method=LIFO)["total_realised_gain"]

    assert fifo != lifo


def test_unknown_method_is_rejected():
    with pytest.raises(ValueError):
        match_disposals(btc_lots(), [], method="hifo")


# --------------------------------------------------------------------- lot mechanics

def test_remaining_lot_is_the_one_not_consumed():
    result = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)

    assert len(result["open_lots"]) == 1
    assert result["open_lots"][0]["unit_cost"] == "50000"


def test_disposal_spanning_lots_reports_each():
    """1.5 BTC under FIFO takes all of the first lot and half the second."""
    result = match_disposals(btc_lots(), [Disposal("btc", "1.5", 60000, DEC)], method=FIFO)
    consumed = result["disposals"][0]["lots_consumed"]

    assert len(consumed) == 2
    assert consumed[0]["quantity"] == "1"
    assert consumed[1]["quantity"] == "0.5"
    # 30000 + 0.5 * 50000
    assert result["disposals"][0]["cost_basis"] == "55000.0"


def test_lots_are_traceable_to_their_source():
    """A gain the filer cannot trace back to its lots cannot be checked."""
    result = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)
    consumed = result["disposals"][0]["lots_consumed"][0]

    assert consumed["source"] == "coinbase"
    assert consumed["acquired"] == JAN.isoformat()


def test_assets_do_not_cross_contaminate():
    """A BTC disposal must never consume an ETH lot."""
    lots = [Lot("btc", 1, 30000, JAN), Lot("eth", 10, 2000, JAN)]
    result = match_disposals(lots, [Disposal("btc", 1, 40000, DEC)], method=FIFO)

    assert result["total_realised_gain"] == "10000"
    assert [lot["asset"] for lot in result["open_lots"]] == ["eth"]


# --------------------------------------------------------------------- ordering

def test_input_order_does_not_change_the_result():
    """Out-of-order input would consume different lots and produce a different, wrong figure —
    silently. Sorting is applied rather than assumed."""
    forward = match_disposals(
        [Lot("btc", 1, 30000, JAN), Lot("btc", 1, 50000, JUN)],
        [Disposal("btc", 1, 60000, DEC)], method=FIFO,
    )
    shuffled = match_disposals(
        [Lot("btc", 1, 50000, JUN), Lot("btc", 1, 30000, JAN)],
        [Disposal("btc", 1, 60000, DEC)], method=FIFO,
    )

    assert forward["total_realised_gain"] == shuffled["total_realised_gain"]


def test_multiple_disposals_apply_chronologically():
    result = match_disposals(
        btc_lots(),
        [Disposal("btc", 1, 70000, DEC), Disposal("btc", 1, 60000, JUN + timedelta(days=1))],
        method=FIFO,
    )

    # The June disposal is applied first and takes the January lot.
    assert result["disposals"][0]["cost_basis"] == "30000"
    assert result["disposals"][1]["cost_basis"] == "50000"


# --------------------------------------------------------------------- incomplete history

def test_disposing_more_than_held_raises():
    """A zero cost basis would maximise the reported gain — wrong in the user's disfavour,
    on a number they file."""
    with pytest.raises(InsufficientLots) as exc:
        match_disposals(btc_lots(), [Disposal("btc", 5, 60000, DEC)], method=FIFO)

    assert exc.value.asset == "btc"
    assert exc.value.shortfall == Decimal("3")


def test_disposing_an_asset_never_acquired_raises():
    with pytest.raises(InsufficientLots):
        match_disposals(btc_lots(), [Disposal("doge", 100, 1, DEC)], method=FIFO)


def test_error_states_the_shortfall():
    with pytest.raises(InsufficientLots) as exc:
        match_disposals(btc_lots(), [Disposal("btc", 3, 60000, DEC)], method=FIFO)

    assert "incomplete" in str(exc.value).lower()


# --------------------------------------------------------------------- precision

def test_no_float_drift_across_many_lots():
    """0.1 has no exact binary float representation; ten of them must still total exactly 1."""
    lots = [Lot("btc", "0.1", 30000, JAN + timedelta(days=i)) for i in range(10)]
    result = match_disposals(lots, [Disposal("btc", "1.0", 40000, DEC)], method=FIFO)

    assert result["disposals"][0]["cost_basis"] == "30000.0"
    assert result["total_realised_gain"] == "10000.0"
    assert result["open_lots"] == []


def test_float_inputs_are_converted_without_capturing_representation_error():
    """Decimal(0.1) preserves the float's error; Decimal(str(0.1)) does not."""
    lot = Lot("btc", 0.1, 30000.0, JAN)
    assert lot.quantity == Decimal("0.1")


def test_fees_reduce_proceeds():
    result = match_disposals(
        btc_lots(), [Disposal("btc", 1, 60000, DEC, fee=100)], method=FIFO
    )
    assert result["disposals"][0]["proceeds"] == "59900"
    assert result["total_realised_gain"] == "29900"


# --------------------------------------------------------------------- holding period

def test_holding_period_is_reported():
    result = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)
    assert result["disposals"][0]["holding_period_days"] == (DEC - JAN).days


def test_long_term_flag_tracks_the_one_year_boundary():
    short = match_disposals(
        [Lot("btc", 1, 100, JAN)],
        [Disposal("btc", 1, 200, JAN + timedelta(days=100))], method=FIFO,
    )
    long = match_disposals(
        [Lot("btc", 1, 100, JAN)],
        [Disposal("btc", 1, 200, JAN + timedelta(days=400))], method=FIFO,
    )

    assert short["disposals"][0]["long_term"] is False
    assert long["disposals"][0]["long_term"] is True


# --------------------------------------------------------------------- honesty

def test_limitations_are_stated_in_the_response():
    """This must never read as tax advice."""
    result = match_disposals(btc_lots(), [], method=FIFO)
    limitations = " ".join(result["limitations"]).lower()

    assert "wash sale" in limitations
    assert "not tax advice" in limitations


def test_engine_is_deterministic():
    """Same input, same output — no clock, no network."""
    a = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)
    b = match_disposals(btc_lots(), [Disposal("btc", 1, 60000, DEC)], method=FIFO)

    assert a == b
