"""Shared failure contract for external integrations.

Why this exists
---------------
Before this module, `CoinbaseService._fetch_balances` returned invented balances — 0.05 BTC,
1 ETH, 2000 USDC, 20 SOL — whenever API keys were unset, logging "Using mock data" at WARNING
and answering 200 OK. `get_balances` then swallowed every exception and returned `{}`, so an
authentication failure and an empty account were indistinguishable.

In a portfolio tracker that is the most dangerous failure mode available. A user cannot tell a
fabricated balance from a real one, and may act on it. An error they can see is strictly
better than a number they cannot trust.

So: integrations raise. They never invent, and never silently return empty.

    IntegrationNotConfigured  -> 503, the caller has not supplied credentials
    IntegrationAuthFailed     -> 502, credentials supplied but the provider rejected them
    IntegrationUnavailable    -> 502, provider reachable but failing (network, rate limit)

Aggregate endpoints catch these per source and report that source as unavailable, so one
missing integration degrades one row rather than the whole response.

Secrets never appear in these errors. `required` lists variable *names* only — this repository
has already leaked a live OpenAI key into pytest output once.
"""

from typing import List, Optional


class IntegrationError(Exception):
    """Base for every integration failure that must surface rather than be masked."""

    status_code = 502
    status = "integration_error"

    def __init__(self, integration: str, message: str, required: Optional[List[str]] = None):
        self.integration = integration
        self.message = message
        # Variable NAMES only. Never values.
        self.required = required or []
        super().__init__(f"{integration}: {message}")

    def to_payload(self) -> dict:
        payload = {
            "status": self.status,
            "integration": self.integration,
            "detail": self.message,
        }
        if self.required:
            payload["required"] = self.required
        return payload


class IntegrationNotConfigured(IntegrationError):
    """No credentials supplied. Expected, and not an error on the user's part."""

    status_code = 503
    status = "not_configured"

    def __init__(self, integration: str, required: List[str]):
        super().__init__(
            integration,
            f"{integration} is not configured. Set {', '.join(required)} to enable it.",
            required=required,
        )


class IntegrationAuthFailed(IntegrationError):
    """Credentials supplied but rejected. Distinct from not-configured: the user acted, and
    the action did not work. Conflating the two sends them looking in the wrong place."""

    status_code = 502
    status = "auth_failed"

    def __init__(self, integration: str, detail: str = "credentials were rejected"):
        super().__init__(integration, detail)


class IntegrationUnavailable(IntegrationError):
    """Reachable but failing — network error, rate limit, provider outage. Transient."""

    status_code = 502
    status = "unavailable"

    def __init__(self, integration: str, detail: str):
        super().__init__(integration, detail)
