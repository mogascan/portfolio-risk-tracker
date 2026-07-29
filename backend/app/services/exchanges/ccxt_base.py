"""Shared ccxt-backed exchange service.

Coinbase and Kraken differ only in which ccxt client they construct and which environment
variables they read, so the behaviour that matters — credential handling, error translation,
and the refusal to invent data — lives here once.

What changed from the previous implementation, and why:

* `_fetch_balances` used to return invented balances (0.05 BTC, 1 ETH, 2000 USDC, 20 SOL)
  when API keys were unset, and answer 200 OK. Now it raises IntegrationNotConfigured.
* `get_balances` caught every exception and returned `{}`, making an auth failure
  indistinguishable from an empty account. Now failures are translated and re-raised.
* `get_historical_balances` returned randomly-varied fake history *unconditionally* — not
  only when unconfigured. There is no honest way to synthesise that series, so it raises
  NotImplementedError rather than fabricating one.
"""

import asyncio
import logging
import os
from typing import Any, Dict, List

import ccxt

from app.services.exchanges.base import ExchangeService
from app.services.integrations import (
    IntegrationAuthFailed,
    IntegrationNotConfigured,
    IntegrationUnavailable,
)

logger = logging.getLogger(__name__)


class CCXTExchangeService(ExchangeService):
    """Base for ccxt-backed exchanges.

    Subclasses set `name`, `ccxt_id`, and `credential_env` (the variable names to read, in
    apiKey/secret order, optionally followed by a password/passphrase).
    """

    name: str = "exchange"
    ccxt_id: str = ""
    credential_env: List[str] = []

    def __init__(self):
        values = [os.getenv(var, "") for var in self.credential_env]
        self._api_key = values[0] if len(values) > 0 else ""
        self._secret = values[1] if len(values) > 1 else ""
        self._password = values[2] if len(values) > 2 else ""

        config = {
            "apiKey": self._api_key,
            "secret": self._secret,
            "enableRateLimit": True,
        }
        if self._password:
            config["password"] = self._password

        self.exchange = getattr(ccxt, self.ccxt_id)(config)

    # ------------------------------------------------------------------ helpers

    @property
    def is_configured(self) -> bool:
        """Both a key and a secret are required. A key alone cannot authenticate."""
        return bool(self._api_key and self._secret)

    def _require_configured(self) -> None:
        if not self.is_configured:
            # Names only — never values.
            raise IntegrationNotConfigured(self.name, self.credential_env[:2])

    async def _call(self, fn, *args):
        """Run a blocking ccxt call off the event loop, translating its errors.

        ccxt raises a wide taxonomy; collapsing it here means callers handle three cases
        rather than twenty, and means no ccxt exception escapes as a bare 500.
        """
        self._require_configured()
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, lambda: fn(*args))
        except ccxt.AuthenticationError as exc:
            logger.warning("%s rejected the supplied credentials", self.name)
            raise IntegrationAuthFailed(self.name, str(exc)) from exc
        except ccxt.PermissionDenied as exc:
            raise IntegrationAuthFailed(
                self.name,
                "the key lacks permission for this call — read access is required",
            ) from exc
        except (ccxt.NetworkError, ccxt.ExchangeError) as exc:
            logger.warning("%s unavailable: %s", self.name, exc)
            raise IntegrationUnavailable(self.name, str(exc)) from exc

    # ------------------------------------------------------------------ interface

    async def get_balances(self) -> Dict[str, float]:
        """Non-zero balances, keyed by lowercase asset symbol.

        Raises rather than returning {} — an empty dict is a legitimate answer for an account
        holding nothing, so it must not double as an error signal.
        """
        data = await self._call(self.exchange.fetch_balance)

        balances: Dict[str, float] = {}
        for currency, entry in data.items():
            if not isinstance(entry, dict):
                continue  # ccxt mixes in 'info', 'free', 'used', 'total' summary keys
            total = entry.get("total") or 0
            if total > 0:
                balances[currency.lower()] = total
        return balances

    async def get_transactions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Recent trades in a normalised shape, newest first."""
        trades = await self._call(self._fetch_trades, limit, offset)

        return [
            {
                "id": t.get("id"),
                "timestamp": t.get("timestamp"),
                "symbol": t.get("symbol"),
                "type": "trade",
                "side": t.get("side"),
                "price": t.get("price"),
                "amount": t.get("amount"),
                "cost": t.get("cost"),
                "fee": (t.get("fee") or {}).get("cost", 0),
                "fee_currency": (t.get("fee") or {}).get("currency", ""),
                "source": self.name,
            }
            for t in trades
        ]

    def _fetch_trades(self, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Trades across every market with a position.

        Iterating all markets is slow but correct; ccxt has no portable "all my trades" call.
        A market that rejects the query is skipped rather than failing the whole request —
        many symbols legitimately have no trade history for this account.
        """
        markets = self.exchange.load_markets()

        all_trades: List[Dict[str, Any]] = []
        for symbol in markets:
            try:
                all_trades.extend(self.exchange.fetch_my_trades(symbol, limit=limit))
            except Exception as exc:  # noqa: BLE001 - per-symbol, deliberately non-fatal
                logger.debug("%s: no trades for %s (%s)", self.name, symbol, exc)

        all_trades.sort(key=lambda t: t.get("timestamp") or 0, reverse=True)
        return all_trades[offset:offset + limit]

    async def get_historical_balances(self, days: int = 30) -> List[Dict[str, Any]]:
        """Not supported.

        The previous implementation invented this series with `random.uniform` jitter and
        returned it unconditionally — fabricated portfolio history presented as real. There is
        no honest way to reconstruct daily balances from a spot balance endpoint; it requires
        replaying transaction history, which belongs with the cost-basis work.
        """
        raise NotImplementedError(
            f"{self.name} does not provide historical balances. "
            "Reconstruct them from transaction history instead of synthesising them."
        )
