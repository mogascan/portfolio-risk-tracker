# backend/app/api/routes/portfolio.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal
import logging

from app.services.exchanges.coinbase import CoinbaseService
from app.services.exchanges.kraken import KrakenService
from app.services.blockchain.eth import EthereumService
from app.services.market_data.coingecko import CoinGeckoService
from app.services.integrations import IntegrationError
from app.services.tax.cost_basis import (
    FIFO,
    METHODS,
    Disposal,
    InsufficientLots,
    Lot,
    match_disposals,
)

# Mounted at /api/v1/accounts, not /api/v1/portfolio: app/api/v1/portfolio.py already
# owns /transactions, and FastAPI would silently shadow one of the two. See
# openspec/changes/complete-portfolio-aggregation/design.md.
router = APIRouter(prefix="/accounts")
logger = logging.getLogger(__name__)

# Services. Supported exchanges are Coinbase and Kraken; Binance is out of scope by product
# decision (2026-07-28) and binance.py stays on disk unwired.
coinbase_service = CoinbaseService()
kraken_service = KrakenService()
ethereum_service = EthereumService()
market_data_service = CoinGeckoService()

# Every configured source. Adding one is a list entry, not a rewrite, because all of them
# satisfy the same interface.
SOURCES = [coinbase_service, kraken_service, ethereum_service]


async def _gather_balances():
    """Collect balances from every source, tolerating individual failures.

    Returns (combined_balances, unavailable). A source that is unconfigured or failing is
    reported in `unavailable` rather than aborting the request — a user with only Coinbase
    connected should still see their Coinbase holdings.

    Balances are summed across sources rather than merged with `{**a, **b}`, which the
    previous implementation used: dict-unpacking silently DISCARDS the earlier value when two
    sources hold the same asset, so holding 1 BTC on Coinbase and 1 BTC on Kraken reported
    1 BTC, not 2. That understated the portfolio without any error.
    """
    combined: dict = {}
    unavailable = []

    for source in SOURCES:
        try:
            balances = await source.get_balances()
        except IntegrationError as exc:
            unavailable.append(exc.to_payload())
            continue

        for asset_id, amount in balances.items():
            combined[asset_id] = combined.get(asset_id, 0) + amount

    return combined, unavailable


@router.get("/summary")
async def get_portfolio_summary():
    """
    Get a summary of the user's portfolio including total value,
    asset allocation, and profit/loss
    """
    try:
        all_assets, unavailable = await _gather_balances()

        # Get current prices. A pricing failure is reported, never papered over: prices
        # multiply balances, so an invented price becomes an invented portfolio value.
        # Balances are still returned — quantities are real even when their value is unknown.
        prices = {}
        asset_ids = list(all_assets.keys())
        if asset_ids:
            try:
                prices = await market_data_service.get_prices(asset_ids)
            except IntegrationError as exc:
                unavailable.append(exc.to_payload())

        # Calculate total portfolio value.
        #
        # Every held asset is listed, including any we could not price. The previous version
        # only appended assets found in `prices`, so an unpriced holding vanished from the
        # response — a user would see their balance disappear rather than see it unpriced.
        # Unpriced assets carry price/value of None and are excluded from the total, which is
        # why `priced_total` is reported separately from the count of what was priced.
        total_value = 0
        portfolio_items = []
        unpriced = []

        for asset_id, amount in all_assets.items():
            price = prices.get(asset_id)
            value = amount * price if price is not None else None

            if value is not None:
                total_value += value
            else:
                unpriced.append(asset_id)

            portfolio_items.append({
                "asset_id": asset_id,
                "symbol": asset_id.upper(),  # Simplified for now
                "amount": amount,
                "price": price,
                "value": value
            })

        # Sort by value, unpriced assets last rather than treated as worthless.
        portfolio_items.sort(key=lambda x: (x["value"] is None, -(x["value"] or 0)))

        return {
            "total_value": total_value,
            "assets": portfolio_items,
            # Assets held but not priced. total_value excludes them, so without this field the
            # total would silently understate the portfolio.
            "unpriced": unpriced,
            # Which sources could not be reached, and why. Present even when empty so clients
            # can rely on the field rather than testing for its existence.
            "unavailable": unavailable,
            "updated_at": market_data_service.last_updated
        }
    
    except Exception as e:
        logger.error(f"Error getting portfolio summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio summary: {str(e)}")

@router.get("/performance")
async def get_portfolio_performance(
    period: str = Query("30d", description="Time period (24h, 7d, 30d, 90d, 1y)")
):
    """
    Get portfolio performance over time
    """
    try:
        # This would typically include historical data from multiple services
        # For MVP, we'll return a simplified structure
        
        # Get historical prices for major assets
        historical_prices = await market_data_service.get_historical_prices(period)
        
        # Calculate portfolio value over time (simplified)
        performance_data = []
        
        # In a real implementation, you would calculate the portfolio value
        # for each day based on historical holdings and prices
        
        return {
            "period": period,
            "data": performance_data
        }
    
    except Exception as e:
        logger.error(f"Error getting portfolio performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio performance: {str(e)}")

@router.get("/assets")
async def get_portfolio_assets():
    """
    Get detailed information about all assets in the portfolio
    """
    try:
        all_assets, unavailable = await _gather_balances()

        # Get asset details
        asset_details = (
            await market_data_service.get_asset_details(list(all_assets.keys()))
            if all_assets else {}
        )

        # Combine with balances
        assets = []
        for asset_id, details in asset_details.items():
            if asset_id in all_assets:
                assets.append({
                    **details,
                    "balance": all_assets[asset_id]
                })

        # Returns an object rather than a bare list: a list has nowhere to report which
        # sources failed, and silently omitting an unreachable exchange is how a user comes to
        # believe holdings have vanished.
        return {"assets": assets, "unavailable": unavailable}

    except Exception as e:
        logger.error(f"Error getting portfolio assets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio assets: {str(e)}")

@router.get("/transactions")
async def get_transactions(
    limit: int = Query(50, description="Number of transactions to return"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get recent transactions across all wallets and exchanges
    """
    try:
        # Collect from every source, tolerating individual failures the same way /summary does
        all_txs = []
        unavailable = []
        for source in SOURCES:
            try:
                all_txs.extend(await source.get_transactions(limit, offset))
            except IntegrationError as exc:
                unavailable.append(exc.to_payload())

        # Sort newest first. `or 0` guards a missing timestamp, which would otherwise raise
        # TypeError comparing None to int and fail the whole request over one bad record.
        all_txs.sort(key=lambda x: x.get("timestamp") or 0, reverse=True)
        
        # Apply pagination
        paginated_txs = all_txs[offset:offset+limit]
        
        return {
            "transactions": paginated_txs,
            "total": len(all_txs),
            "limit": limit,
            "offset": offset,
            "unavailable": unavailable
        }
    
    except Exception as e:
        logger.error(f"Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

@router.get("/tax")
async def get_tax_summary(
    year: int = Query(2024, description="Tax year"),
    method: str = Query(FIFO, description="Cost-basis method: fifo or lifo"),
):
    """Realised gains and losses for a tax year, from tracked lots.

    Previously returned hardcoded zeros — total_gains 0, estimated_tax 0, events [] — which
    reads as "you owe nothing" rather than "this is not implemented". That is the worst
    possible default for a tax figure, so it is gone.

    Disposals are matched against acquisitions by the selected method. Because matching needs
    the full acquisition history, the calculation covers every transaction available and then
    reports the disposals falling in the requested year: a coin bought in 2023 and sold in 2024
    has its basis in 2023.
    """
    if method.lower() not in METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown method '{method}'. Expected one of {list(METHODS)}.",
        )

    try:
        transactions = []
        unavailable = []
        for source in SOURCES:
            try:
                transactions.extend(await source.get_transactions(limit=1000, offset=0))
            except IntegrationError as exc:
                unavailable.append(exc.to_payload())

        lots, disposals, skipped = _to_lots_and_disposals(transactions)

        try:
            result = match_disposals(lots, disposals, method=method.lower())
        except InsufficientLots as exc:
            # Incomplete history. Say so rather than reporting a gain computed from a basis
            # that was never established.
            raise HTTPException(
                status_code=422,
                detail={
                    "status": "incomplete_history",
                    "asset": exc.asset,
                    "shortfall": str(exc.shortfall),
                    "detail": str(exc),
                    "unavailable": unavailable,
                },
            )

        in_year = [
            d for d in result["disposals"]
            if d["disposed_at"].startswith(str(year))
        ]
        gains = sum(Decimal(d["realised_gain"]) for d in in_year if Decimal(d["realised_gain"]) > 0)
        losses = sum(Decimal(d["realised_gain"]) for d in in_year if Decimal(d["realised_gain"]) < 0)

        return {
            "year": year,
            "method": result["method"],
            "summary": {
                "total_gains": str(gains),
                "total_losses": str(losses),
                "net_profit_loss": str(gains + losses),
                "disposal_count": len(in_year),
            },
            "events": in_year,
            "open_lots": result["open_lots"],
            # Transactions that could not be interpreted as an acquisition or disposal.
            # Reported rather than dropped: a silently ignored trade changes the answer.
            "skipped_transactions": skipped,
            "unavailable": unavailable,
            "limitations": result["limitations"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get tax summary: {str(e)}")


def _to_lots_and_disposals(transactions):
    """Split normalised transactions into acquisitions and disposals.

    Anything that is neither a recognisable buy nor sell — a transfer between the user's own
    accounts, a record missing a price or timestamp — is returned in `skipped` rather than
    guessed at. Guessing here alters a tax figure.
    """
    lots, disposals, skipped = [], [], []

    for tx in transactions:
        side = (tx.get("side") or "").lower()
        symbol = (tx.get("symbol") or "").split("/")[0].lower()
        amount = tx.get("amount")
        price = tx.get("price")
        timestamp = tx.get("timestamp")

        if not symbol or amount in (None, 0) or price is None or not timestamp:
            skipped.append({"id": tx.get("id"), "reason": "missing symbol, amount, price or timestamp"})
            continue

        when = datetime.fromtimestamp(timestamp / 1000) if isinstance(timestamp, (int, float)) \
            else datetime.fromisoformat(str(timestamp))

        if side == "buy":
            lots.append(Lot(symbol, amount, price, when, source=tx.get("source", "unknown")))
        elif side == "sell":
            disposals.append(Disposal(
                symbol, amount, price, when,
                fee=tx.get("fee") or 0, source=tx.get("source", "unknown"),
            ))
        else:
            skipped.append({"id": tx.get("id"), "reason": f"unrecognised side {side!r}"})

    return lots, disposals, skipped