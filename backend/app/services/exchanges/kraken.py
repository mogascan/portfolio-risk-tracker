# backend/app/services/exchanges/kraken.py
"""Kraken, via ccxt.

New in this change. Kraken replaces Binance as the second supported exchange — a product
decision taken 2026-07-28, not a reaction to anything broken. binance.py remains on disk,
unwired, and must not be re-imported.

All behaviour lives in CCXTExchangeService; this file only names the client and its
credentials.

When creating the API key, grant "Query Funds" and "Query Ledger Entries" only. This
application never places orders, so "Create & Modify Orders" and "Withdraw Funds" are pure
added risk.
"""

from app.services.exchanges.ccxt_base import CCXTExchangeService


class KrakenService(CCXTExchangeService):
    name = "kraken"
    ccxt_id = "kraken"
    credential_env = ["KRAKEN_API_KEY", "KRAKEN_API_SECRET"]
