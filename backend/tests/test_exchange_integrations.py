"""Exchange integrations refuse to invent data.

The behaviour under test is a deletion, which is easy to reintroduce by accident, so these
tests assert the absence directly.

Before this change, CoinbaseService returned 0.05 BTC, 1 ETH, 2000 USDC and 20 SOL whenever
API keys were unset — logged as "Using mock data" at WARNING, served as 200 OK. A user could
not distinguish that from a real balance. `get_balances` also swallowed every exception and
returned {}, so an authentication failure looked identical to an empty account.

CI runs with no credentials, so the unconfigured path is the one exercised here. That is the
path most likely to regress, because it is the one nobody sees while developing with a
populated .env.
"""

import pytest

from app.services.exchanges.coinbase import CoinbaseService
from app.services.exchanges.kraken import KrakenService
from app.services.integrations import (
    IntegrationAuthFailed,
    IntegrationNotConfigured,
    IntegrationUnavailable,
)

SERVICES = [
    pytest.param(CoinbaseService, "coinbase", id="coinbase"),
    pytest.param(KrakenService, "kraken", id="kraken"),
]


@pytest.fixture(autouse=True)
def _no_credentials(monkeypatch):
    """Guarantee the unconfigured path regardless of the developer's .env."""
    for var in (
        "COINBASE_API_KEY", "COINBASE_API_SECRET", "COINBASE_PASSPHRASE",
        "KRAKEN_API_KEY", "KRAKEN_API_SECRET",
    ):
        monkeypatch.delenv(var, raising=False)


# --------------------------------------------------------------------- unconfigured

@pytest.mark.parametrize("service_cls,name", SERVICES)
def test_reports_unconfigured(service_cls, name):
    assert service_cls().is_configured is False


@pytest.mark.parametrize("service_cls,name", SERVICES)
async def test_balances_raise_instead_of_returning_mock_data(service_cls, name):
    """The core regression guard. Fails if any mock fallback returns."""
    with pytest.raises(IntegrationNotConfigured) as exc:
        await service_cls().get_balances()

    assert exc.value.integration == name
    assert exc.value.status_code == 503


@pytest.mark.parametrize("service_cls,name", SERVICES)
async def test_transactions_raise_instead_of_returning_mock_data(service_cls, name):
    with pytest.raises(IntegrationNotConfigured):
        await service_cls().get_transactions()


@pytest.mark.parametrize("service_cls,name", SERVICES)
async def test_historical_balances_are_not_synthesised(service_cls, name):
    """Previously returned a random-jittered fake series, unconditionally."""
    with pytest.raises((NotImplementedError, IntegrationNotConfigured)):
        await service_cls().get_historical_balances(days=30)


# --------------------------------------------------------------------- error contract

@pytest.mark.parametrize("service_cls,name", SERVICES)
def test_error_names_required_variables(service_cls, name):
    error = IntegrationNotConfigured(name, service_cls.credential_env[:2])
    payload = error.to_payload()

    assert payload["status"] == "not_configured"
    assert payload["integration"] == name
    assert payload["required"] == service_cls.credential_env[:2]


@pytest.mark.parametrize("service_cls,name", SERVICES)
def test_error_payload_carries_names_not_values(service_cls, name, monkeypatch):
    """A leaked credential in an error body would be served to the client.

    This repository has already leaked a live OpenAI key into pytest output once.
    """
    secret = "SUPER-SECRET-VALUE-do-not-leak"
    for var in service_cls.credential_env:
        monkeypatch.setenv(var, secret)

    payload = IntegrationNotConfigured(name, service_cls.credential_env[:2]).to_payload()
    assert secret not in str(payload)


def test_not_configured_and_auth_failed_are_distinct():
    """Different causes, different fixes: supply credentials vs. correct them."""
    not_configured = IntegrationNotConfigured("kraken", ["KRAKEN_API_KEY"])
    auth_failed = IntegrationAuthFailed("kraken")

    assert not_configured.status_code == 503
    assert auth_failed.status_code == 502
    assert not_configured.status != auth_failed.status


def test_unavailable_is_distinct_from_auth_failure():
    """A rate limit is transient; a bad key is not. Retry advice differs."""
    unavailable = IntegrationUnavailable("coinbase", "rate limited")
    assert unavailable.status == "unavailable"
    assert unavailable.status != IntegrationAuthFailed("coinbase").status


# --------------------------------------------------------------------- scope

def test_binance_is_not_wired_into_aggregation():
    """Binance is out of scope by product decision, not because it is broken.

    binance.py stays on disk with working ccxt code, so the guard has to be that the
    aggregation path never imports or instantiates it — a comment mentioning the decision is
    fine, a BinanceService reference is not.
    """
    from app.api.routes import portfolio as aggregation

    source = open(aggregation.__file__).read()
    assert "BinanceService" not in source
    assert "binance_service" not in source
