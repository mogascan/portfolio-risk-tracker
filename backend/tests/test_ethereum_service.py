"""Ethereum reads from chain, or says it cannot. It never invents.

Before this change the service was a facade: every web3 call was commented out, `web3` was
absent from requirements.txt, and all three methods returned mock data — including a
`random.uniform`-jittered historical series. It reported holdings for a chain it had never
contacted.

It also defaulted to two hardcoded "test wallets" when ETH_WALLET_ADDRESSES was unset, so an
unconfigured deployment showed a stranger's balances as the user's own. That fallback is gone,
and this file guards its absence.

CI has no RPC endpoint, so the unconfigured and validation paths are what run here.
"""

import pytest

from app.services.blockchain.eth import EthereumService
from app.services.integrations import IntegrationNotConfigured


@pytest.fixture
def unconfigured(monkeypatch):
    monkeypatch.setattr("app.core.settings.ETHEREUM_RPC_URL", "", raising=False)
    monkeypatch.setattr("app.core.settings.ETH_WALLET_ADDRESSES", "", raising=False)
    return EthereumService()


# --------------------------------------------------------------------- configuration

def test_unconfigured_service_reports_itself(unconfigured):
    assert unconfigured.is_configured is False


def test_no_default_test_wallets(unconfigured):
    """The removed fallback. Defaulting to hardcoded addresses meant an unconfigured
    deployment displayed someone else's holdings as the user's."""
    assert unconfigured.wallet_addresses == []


async def test_balances_raise_when_unconfigured(unconfigured):
    with pytest.raises(IntegrationNotConfigured) as exc:
        await unconfigured.get_balances()

    assert exc.value.integration == "ethereum"
    assert exc.value.status_code == 503
    assert "ETHEREUM_RPC_URL" in exc.value.required


async def test_transactions_raise_when_unconfigured(unconfigured):
    with pytest.raises(IntegrationNotConfigured):
        await unconfigured.get_transactions()


async def test_historical_balances_are_not_synthesised(unconfigured):
    """Previously returned a random-jittered fake series."""
    with pytest.raises((NotImplementedError, IntegrationNotConfigured)):
        await unconfigured.get_historical_balances(days=30)


# --------------------------------------------------------------------- address handling

def test_valid_addresses_are_parsed():
    parsed = EthereumService._parse_addresses(
        "0x71C7656EC7ab88b098defB751B7401B5f6d8976F,"
        " 0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5 "
    )
    assert len(parsed) == 2
    assert all(a.startswith("0x") for a in parsed)


def test_malformed_addresses_are_dropped_not_forwarded():
    """Sending garbage to an RPC provider wastes a call and returns a confusing error."""
    parsed = EthereumService._parse_addresses(
        "0x71C7656EC7ab88b098defB751B7401B5f6d8976F,not-an-address,0x123"
    )
    assert parsed == ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F"]


def test_empty_configuration_yields_no_addresses():
    assert EthereumService._parse_addresses("") == []
    assert EthereumService._parse_addresses("  ,  ") == []


def test_private_key_is_rejected_loudly():
    """The safety property that matters most in this module.

    A 64-hex-character string is a private key, not an address. Someone pasting one into
    ETH_WALLET_ADDRESSES has made a serious mistake; forwarding it to a third-party RPC
    provider would compound it into a disclosed key.
    """
    fake_key = "0x" + "a" * 64

    with pytest.raises(ValueError) as exc:
        EthereumService._parse_addresses(fake_key)

    assert "private key" in str(exc.value).lower()
    # The message must not echo the value it is refusing.
    assert "a" * 64 not in str(exc.value)


def test_private_key_without_0x_prefix_is_also_rejected():
    with pytest.raises(ValueError):
        EthereumService._parse_addresses("b" * 64)


def test_private_key_mixed_with_valid_addresses_still_rejects():
    """Fail closed. Silently using the good entries would leave the key in the config."""
    with pytest.raises(ValueError):
        EthereumService._parse_addresses(
            "0x71C7656EC7ab88b098defB751B7401B5f6d8976F," + "c" * 64
        )


# --------------------------------------------------------------------- scanner honesty

def test_scanner_reports_no_transfers_for_no_addresses():
    from app.services.blockchain.scanner import scan_transfers

    assert scan_transfers(w3=None, addresses=[], lookback_blocks=100) == []


def test_scanner_declares_its_window():
    """Results must carry the scanned range so partial history is never mistaken for full
    history — the reason this scans rather than claiming completeness."""
    from app.services.blockchain import scanner

    log = {
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "data": "0x64",
        "transactionHash": "0xabc",
        "logIndex": 0,
        "blockNumber": 500,
    }
    formatted = scanner._format(log, {}, scanned_from=100, scanned_to=600)

    assert formatted["scanned_from_block"] == 100
    assert formatted["scanned_to_block"] == 600
    assert formatted["amount_raw"] == 100
    assert formatted["source"] == "ethereum"
