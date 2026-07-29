# backend/app/services/exchanges/coinbase.py
"""Coinbase, via ccxt.

All behaviour lives in CCXTExchangeService. This file only declares which ccxt client to
build and which environment variables hold its credentials.

The previous implementation returned invented balances and trades when keys were unset, and
fabricated a random historical series unconditionally. See ccxt_base.py for why that is gone.
"""

from app.services.exchanges.ccxt_base import CCXTExchangeService


class CoinbaseService(CCXTExchangeService):
    name = "coinbase"
    ccxt_id = "coinbasepro"
    # Third entry is the Coinbase Pro / Advanced Trade passphrase, optional for standard keys.
    credential_env = ["COINBASE_API_KEY", "COINBASE_API_SECRET", "COINBASE_PASSPHRASE"]
