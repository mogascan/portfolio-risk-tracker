"""CoinGecko → TradingView symbol mapping, and golden/death-cross alert storage.

Context, because this was archaeology rather than design.

`backend/data/cross_alerts.json` held eight alerts received in March 2025 — BTCUSDT,
alertType "approaching", percentage 70 and 80 — and nothing in the repository read or wrote
it. `frontend/src/api/symbolsService.js` called /api/symbols, /api/symbols/refresh and
/api/symbols/alert-setup, none of which existed server-side, and nothing imported that client
either. There was no webhook receiver anywhere, and no server.js.

So the feature was: TradingView watches for a 50/200 moving-average crossover, fires an alert
at a webhook, and the app records it. Three quarters of that was missing. This module supplies
the mapping and the storage; symbols.py supplies the routes.

Why a mapping is needed at all: TradingView identifies instruments as EXCHANGE:PAIR
(COINBASE:BTCUSD), while this app identifies assets by CoinGecko id (bitcoin). Neither can be
derived from the other, so the user cannot be told which charts to put alerts on without one.

Note on the exchange prefix: it names a *chart data source*, not an account. Binance being out
of scope as a portfolio integration does not make BINANCE:BTCUSDT an invalid chart to watch —
but the default here is COINBASE, to match what this project actually supports.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core import settings

logger = logging.getLogger(__name__)

ALERTS_FILE = os.path.join(settings.DATA_DIR, "cross_alerts.json")

# TradingView quote currency differs by venue: Coinbase lists BTC-USD, Binance BTCUSDT.
QUOTE_BY_EXCHANGE = {
    "COINBASE": "USD",
    "KRAKEN": "USD",
    "BINANCE": "USDT",
}

DEFAULT_EXCHANGE = "COINBASE"

# The three conditions the frontend groups instructions by. These strings are a contract with
# symbolsService.generateAlertInstructions — changing them silently empties a group there.
CONDITIONS = [
    "Approaching Golden Cross",
    "Golden Cross Complete",
    "Death Cross",
]


def to_tradingview_symbol(symbol: str, exchange: str = DEFAULT_EXCHANGE) -> str:
    """Render an asset symbol as a TradingView instrument identifier."""
    exchange = exchange.upper()
    quote = QUOTE_BY_EXCHANGE.get(exchange, "USD")
    return f"{exchange}:{symbol.upper()}{quote}"


def build_symbol_map(coins: List[Dict[str, Any]], exchange: str = DEFAULT_EXCHANGE) -> List[Dict[str, Any]]:
    """Map market coins onto TradingView symbols.

    `coins` are CoinGecko-shaped dicts. Anything without a symbol is skipped rather than
    guessed at — an incorrect mapping would send the user to set an alert on the wrong chart,
    which is worse than an absent one.
    """
    mapped = []
    for coin in coins:
        symbol = (coin.get("symbol") or "").strip()
        if not symbol:
            continue

        mapped.append({
            "id": coin.get("id"),
            "name": coin.get("name"),
            "symbol": symbol.upper(),
            "tradingview_symbol": to_tradingview_symbol(symbol, exchange),
            "exchange": exchange.upper(),
            "market_cap_rank": coin.get("market_cap_rank"),
        })
    return mapped


def build_alert_setup(symbols: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Describe the alerts to create, in the shape the frontend expects.

    symbolsService.generateAlertInstructions reads `symbols[].alerts[].condition` and groups
    by the exact strings in CONDITIONS.
    """
    short_ma = getattr(settings, "SHORT_MA_PERIOD", 50)
    long_ma = getattr(settings, "LONG_MA_PERIOD", 200)
    threshold = getattr(settings, "APPROACHING_THRESHOLD", 0.02)

    entries = []
    for item in symbols:
        entries.append({
            **item,
            "alerts": [
                {
                    "condition": "Approaching Golden Cross",
                    "description": (
                        f"{short_ma}MA within {threshold:.0%} of {long_ma}MA and rising"
                    ),
                },
                {
                    "condition": "Golden Cross Complete",
                    "description": f"{short_ma}MA crosses above {long_ma}MA",
                },
                {
                    "condition": "Death Cross",
                    "description": f"{short_ma}MA crosses below {long_ma}MA",
                },
            ],
        })

    return {
        "indicator": "Golden/Death Cross Detector",
        "short_ma_period": short_ma,
        "long_ma_period": long_ma,
        "approaching_threshold": threshold,
        "conditions": CONDITIONS,
        "symbols": entries,
    }


# ---------------------------------------------------------------------- alert storage

def load_alerts() -> List[Dict[str, Any]]:
    """Read recorded alerts. A missing or malformed file yields an empty list, not a crash —
    no alerts having been received is a normal state, especially before any are set up."""
    if not os.path.exists(ALERTS_FILE):
        return []
    try:
        with open(ALERTS_FILE) as handle:
            return json.load(handle).get("alerts", [])
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("Could not read %s: %s", ALERTS_FILE, exc)
        return []


def record_alert(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Append an incoming TradingView alert.

    `received` is stamped server-side. `timestamp` comes from the sender and is not trusted to
    exist — TradingView alert bodies are user-authored templates and frequently omit it.
    """
    alert = {
        "symbol": payload.get("symbol"),
        "alertType": payload.get("alertType"),
        "price": payload.get("price"),
        "percentage": payload.get("percentage"),
        "timestamp": payload.get("timestamp"),
        "received": datetime.now(timezone.utc).isoformat(),
    }

    alerts = load_alerts()
    alerts.append(alert)

    os.makedirs(os.path.dirname(ALERTS_FILE), exist_ok=True)
    with open(ALERTS_FILE, "w") as handle:
        json.dump({"alerts": alerts}, handle, indent=2)

    return alert


def filter_alerts(
    alerts: List[Dict[str, Any]],
    symbol: Optional[str] = None,
    alert_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Newest first, optionally narrowed by symbol or type."""
    result = alerts
    if symbol:
        result = [a for a in result if (a.get("symbol") or "").upper() == symbol.upper()]
    if alert_type:
        result = [a for a in result if a.get("alertType") == alert_type]

    return sorted(result, key=lambda a: a.get("received") or "", reverse=True)
