"""TradingView symbol mapping, golden/death-cross alerts, and token supply data.

Four of these routes were called by the frontend and did not exist server-side. The fifth —
the webhook receiver — was never built at all, despite `data/cross_alerts.json` containing
alerts that something must once have written.

Mounted under /api/v1 like everything else. `frontend/src/api/symbolsService.js` targets
bare /api/symbols, so its URLs are updated alongside this; leaving the routes at /api to match
a client nobody imports would have entrenched an inconsistency for no benefit.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, HTTPException, Path, Query

from app.services.integrations import IntegrationError
from app.services.market_data.coingecko import CoinGeckoService
from app.services.market_data.tradingview_symbols import (
    DEFAULT_EXCHANGE,
    build_alert_setup,
    build_symbol_map,
    filter_alerts,
    load_alerts,
    record_alert,
)

router = APIRouter(tags=["Symbols & Alerts"])
logger = logging.getLogger(__name__)

market_service = CoinGeckoService()

# Cached mapping. Rebuilt on demand via /symbols/refresh rather than on a timer: the mapping
# changes only when the tracked coin set does, and CoinGecko's free tier rate-limits.
_symbol_cache: Dict[str, Any] = {"exchange": None, "symbols": []}


async def _build_symbols(exchange: str):
    """Fetch market data and map it. Pricing failures surface rather than yielding a
    half-populated list that looks authoritative."""
    market_data = await market_service.get_market_data()
    coins = market_data.get("prices") or market_data.get("coins") or []
    return build_symbol_map(coins, exchange)


@router.get("/symbols")
async def get_symbols(exchange: str = Query(DEFAULT_EXCHANGE, description="TradingView exchange prefix")):
    """TradingView symbols for the tracked coins."""
    try:
        if _symbol_cache["exchange"] != exchange.upper() or not _symbol_cache["symbols"]:
            _symbol_cache["symbols"] = await _build_symbols(exchange)
            _symbol_cache["exchange"] = exchange.upper()

        return {"exchange": exchange.upper(), "symbols": _symbol_cache["symbols"]}

    except IntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_payload())
    except Exception as exc:
        logger.error("Error building symbol map: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to build symbol map: {exc}")


@router.post("/symbols/refresh")
async def refresh_symbols(exchange: str = Query(DEFAULT_EXCHANGE)):
    """Force a rebuild of the symbol mapping."""
    try:
        _symbol_cache["symbols"] = await _build_symbols(exchange)
        _symbol_cache["exchange"] = exchange.upper()

        return {
            "exchange": exchange.upper(),
            "count": len(_symbol_cache["symbols"]),
            "symbols": _symbol_cache["symbols"],
        }

    except IntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_payload())
    except Exception as exc:
        logger.error("Error refreshing symbols: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to refresh symbols: {exc}")


@router.get("/symbols/alert-setup")
async def get_alert_setup(exchange: str = Query(DEFAULT_EXCHANGE)):
    """Which alerts to create in TradingView, and on which charts.

    The frontend renders this into setup instructions, grouping by the exact condition strings
    in tradingview_symbols.CONDITIONS.
    """
    try:
        symbols = _symbol_cache["symbols"]
        if _symbol_cache["exchange"] != exchange.upper() or not symbols:
            symbols = await _build_symbols(exchange)
            _symbol_cache["symbols"] = symbols
            _symbol_cache["exchange"] = exchange.upper()

        return build_alert_setup(symbols)

    except IntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_payload())
    except Exception as exc:
        logger.error("Error building alert setup: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to build alert setup: {exc}")


@router.post("/webhooks/tradingview")
async def receive_tradingview_alert(payload: Dict[str, Any] = Body(...)):
    """Receive a golden/death-cross alert fired by TradingView.

    The missing piece. data/cross_alerts.json held eight alerts from March 2025 with nothing
    in the repository able to write them.

    Deliberately permissive about the body: TradingView alert messages are free-text templates
    the user authors, so fields are frequently missing or renamed. A rejected alert is lost
    forever — TradingView does not retry — so anything with a symbol is recorded, and
    validation happens on read.
    """
    if not payload.get("symbol"):
        raise HTTPException(
            status_code=400,
            detail="Alert must include a 'symbol'. Check the TradingView alert message body.",
        )

    alert = record_alert(payload)
    logger.info("Recorded TradingView alert for %s (%s)", alert["symbol"], alert["alertType"])
    return {"status": "recorded", "alert": alert}


@router.get("/alerts/cross")
async def get_cross_alerts(
    symbol: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None, alias="alertType"),
    limit: int = Query(50, ge=1, le=500),
):
    """Recorded cross alerts, newest first."""
    alerts = filter_alerts(load_alerts(), symbol=symbol, alert_type=alert_type)
    return {"alerts": alerts[:limit], "total": len(alerts)}


@router.get("/token/{token_id}")
async def get_token_details(token_id: str = Path(..., description="CoinGecko coin id")):
    """Supply and valuation data for one token.

    TokenUnlockAnalyzer calls this and, when it 404s, falls back to assuming circulating
    supply is 20% of total — a number with no basis that then drives every unlock calculation
    on the page. Returning real data removes that guess.
    """
    try:
        details = await market_service.get_asset_details([token_id])

        token = details.get(token_id)
        if not token:
            raise HTTPException(status_code=404, detail=f"No market data for token '{token_id}'")

        return token

    except HTTPException:
        raise
    except IntegrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.to_payload())
    except Exception as exc:
        logger.error("Error fetching token %s: %s", token_id, exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch token data: {exc}")
