"""Aggregation sums correctly and degrades one source at a time.

Two behaviours are load-bearing here:

1. Balances are SUMMED across sources. The original code merged with `{**a, **b}`, which
   discards the earlier value on a key collision — 1 BTC on Coinbase plus 1 BTC on Kraken
   reported 1 BTC. It understated holdings with no error, which is the quietest possible way
   to be wrong about someone's money.

2. An unconfigured or failing source degrades that source only. CI runs with no credentials,
   so in practice every source is unavailable; a user with one exchange connected must still
   see it.
"""

import pytest

from app.api.routes import portfolio as aggregation
from app.services.integrations import (
    IntegrationAuthFailed,
    IntegrationNotConfigured,
    IntegrationUnavailable,
)


class FakeSource:
    """Stands in for an exchange or wallet service."""

    def __init__(self, name, balances=None, error=None, transactions=None):
        self.name = name
        self._balances = balances or {}
        self._error = error
        self._transactions = transactions or []

    async def get_balances(self):
        if self._error:
            raise self._error
        return dict(self._balances)

    async def get_transactions(self, limit=50, offset=0):
        if self._error:
            raise self._error
        return list(self._transactions)


@pytest.fixture
def use_sources(monkeypatch):
    def _apply(*sources):
        monkeypatch.setattr(aggregation, "SOURCES", list(sources))
    return _apply


# --------------------------------------------------------------------- summing

async def test_same_asset_on_two_sources_is_summed(use_sources):
    """The regression guard. Dict-unpacking would report 1.0 here instead of 2.0."""
    use_sources(
        FakeSource("coinbase", {"btc": 1.0}),
        FakeSource("kraken", {"btc": 1.0}),
    )

    balances, unavailable = await aggregation._gather_balances()

    assert balances == {"btc": 2.0}
    assert unavailable == []


async def test_distinct_assets_are_combined(use_sources):
    use_sources(
        FakeSource("coinbase", {"btc": 0.5}),
        FakeSource("kraken", {"eth": 3.0}),
        FakeSource("ethereum", {"eth": 1.0, "usdc": 100.0}),
    )

    balances, _ = await aggregation._gather_balances()

    assert balances == {"btc": 0.5, "eth": 4.0, "usdc": 100.0}


async def test_no_sources_configured_yields_empty_not_error(use_sources):
    """Empty is a legitimate answer; it must not be conflated with failure."""
    use_sources()
    balances, unavailable = await aggregation._gather_balances()
    assert balances == {}
    assert unavailable == []


# --------------------------------------------------------------------- degradation

async def test_one_unconfigured_source_does_not_hide_the_others(use_sources):
    use_sources(
        FakeSource("coinbase", {"btc": 1.0}),
        FakeSource("kraken", error=IntegrationNotConfigured(
            "kraken", ["KRAKEN_API_KEY", "KRAKEN_API_SECRET"])),
        FakeSource("ethereum", error=IntegrationNotConfigured(
            "ethereum", ["ETHEREUM_RPC_URL"])),
    )

    balances, unavailable = await aggregation._gather_balances()

    assert balances == {"btc": 1.0}
    assert {u["integration"] for u in unavailable} == {"kraken", "ethereum"}
    assert all(u["status"] == "not_configured" for u in unavailable)


async def test_unavailable_entries_explain_themselves(use_sources):
    """A bare "unavailable" flag is not actionable; the reason determines the fix."""
    use_sources(
        FakeSource("kraken", error=IntegrationAuthFailed("kraken")),
        FakeSource("ethereum", error=IntegrationUnavailable("ethereum", "RPC timeout")),
    )

    _, unavailable = await aggregation._gather_balances()
    by_name = {u["integration"]: u for u in unavailable}

    assert by_name["kraken"]["status"] == "auth_failed"
    assert by_name["ethereum"]["status"] == "unavailable"
    assert "timeout" in by_name["ethereum"]["detail"]


async def test_every_source_failing_is_still_a_response(use_sources):
    """The state CI runs in. Must not raise."""
    use_sources(
        FakeSource("coinbase", error=IntegrationNotConfigured("coinbase", ["COINBASE_API_KEY"])),
        FakeSource("kraken", error=IntegrationNotConfigured("kraken", ["KRAKEN_API_KEY"])),
    )

    balances, unavailable = await aggregation._gather_balances()

    assert balances == {}
    assert len(unavailable) == 2


async def test_credentials_never_appear_in_unavailable_payloads(use_sources):
    """These payloads are served to the client."""
    secret = "kraken-secret-value"
    use_sources(FakeSource("kraken", error=IntegrationAuthFailed("kraken", "rejected")))

    _, unavailable = await aggregation._gather_balances()

    assert secret not in str(unavailable)


# --------------------------------------------------------------------- scope

def test_supported_sources_exclude_binance():
    """SOURCES is the list that decides what the product integrates with."""
    names = [type(s).__name__ for s in aggregation.SOURCES]
    assert "BinanceService" not in names
    assert "CoinbaseService" in names
    assert "KrakenService" in names
