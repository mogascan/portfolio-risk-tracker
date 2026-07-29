"""The aggregation router is registered and does not shadow the manual portfolio API.

These tests exist because of a specific, repeated failure in this repository: code written to
a plausible shape, never wired into main.py, and therefore silently absent. api/routes/
portfolio.py sat unregistered long enough to be mistaken for dead code and deleted.

Each test fails if that wiring is removed again.

They read the OpenAPI schema rather than walking app.routes. FastAPI 0.140 wraps included
routers in lazy _IncludedRouter objects instead of flattening them into APIRoute, so
iterating app.routes finds only the two endpoints declared directly on the app. The schema is
both version-agnostic and a truer target: it is the surface clients actually see.
"""

import pytest

from app.main import app


@pytest.fixture(scope="module")
def paths():
    return app.openapi()["paths"]


AGGREGATION_ENDPOINTS = [
    "/api/v1/accounts/summary",
    "/api/v1/accounts/performance",
    "/api/v1/accounts/assets",
    "/api/v1/accounts/transactions",
    "/api/v1/accounts/tax",
]


def test_accounts_router_is_registered(paths):
    """Fails if the include_router line for accounts_router is dropped from main.py."""
    assert "/api/v1/accounts/summary" in paths


@pytest.mark.parametrize("endpoint", AGGREGATION_ENDPOINTS)
def test_aggregation_endpoint_is_reachable(paths, endpoint):
    """The full set the MVP acceptance test depends on."""
    assert endpoint in paths
    assert "get" in paths[endpoint]


def test_manual_portfolio_api_is_not_shadowed(paths):
    """Guards the collision that made the /accounts prefix necessary.

    Both routers define /transactions. FastAPI resolves to the first registration, so
    mounting the aggregation router under /portfolio would silently disable one of them —
    without an error, which is exactly how this class of bug survives.
    """
    assert "/api/v1/portfolio/transactions" in paths
    assert "/api/v1/accounts/transactions" in paths


def test_aggregation_is_not_mounted_under_portfolio(paths):
    """The prefix decision itself. Fails if someone 'tidies' /accounts back to /portfolio."""
    for endpoint in AGGREGATION_ENDPOINTS:
        assert endpoint.startswith("/api/v1/accounts/")

    assert "/api/v1/portfolio/summary" not in paths
    assert "/api/v1/portfolio/tax" not in paths


def test_binance_is_not_exposed(paths):
    """Binance is out of scope by product decision, not by accident."""
    assert not any("binance" in p.lower() for p in paths)
