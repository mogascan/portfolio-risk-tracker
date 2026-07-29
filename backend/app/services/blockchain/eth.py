# backend/app/services/blockchain/eth.py
"""Ethereum balances and transfer history, read over JSON-RPC.

Rewritten 2026-07-28. Previously this was a facade: every `web3` call was commented out,
`web3` was not in requirements.txt at all, and every method returned mock data — balances,
transactions, and a `random.uniform`-jittered historical series. It reported holdings for a
chain it had never contacted.

Read-only by construction. Public addresses only; this module has no code path that accepts,
stores, or transmits a private key or seed phrase, and it rejects input shaped like one rather
than passing it to an RPC node.
"""

import asyncio
import logging
import re
from typing import Any, Dict, List

from app.core import settings
from app.services.integrations import (
    IntegrationNotConfigured,
    IntegrationUnavailable,
)

logger = logging.getLogger(__name__)

# ERC-20 subset: enough to read a balance and describe the token.
ERC20_ABI = [
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}],
     "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}],
     "type": "function"},
    {"constant": True, "inputs": [], "name": "decimals",
     "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "symbol",
     "outputs": [{"name": "", "type": "string"}], "type": "function"},
]

TRACKED_TOKENS = {
    "usdt": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "usdc": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "dai": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    "link": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
}

ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")

# A 64-hex-character string is a private key, not an address. Someone pasting one into
# ETH_WALLET_ADDRESSES has made a serious mistake, and forwarding it to an RPC provider would
# compound it. Refuse loudly instead.
PRIVATE_KEY_RE = re.compile(r"^(0x)?[a-fA-F0-9]{64}$")

# Bounded history window. An RPC node cannot answer "every transaction for this address"
# without an index, so we scan a recent range and say so. ~7200 blocks is roughly 24h at
# 12s/block.
DEFAULT_SCAN_BLOCKS = 7_200


class EthereumService:
    """Read-only Ethereum access for the configured wallet addresses."""

    name = "ethereum"
    credential_env = ["ETHEREUM_RPC_URL", "ETH_WALLET_ADDRESSES"]

    def __init__(self):
        self.rpc_url = getattr(settings, "ETHEREUM_RPC_URL", "") or ""
        self.wallet_addresses = self._parse_addresses(
            getattr(settings, "ETH_WALLET_ADDRESSES", "") or ""
        )
        self._w3 = None

    # ------------------------------------------------------------------ config

    @staticmethod
    def _parse_addresses(raw: str) -> List[str]:
        """Validate and normalise the configured addresses.

        Anything that is not a 20-byte hex address is dropped with a warning rather than
        passed through. There is deliberately no fallback list: the previous implementation
        returned two hardcoded 'test wallets' when unset, so an unconfigured deployment
        silently reported a stranger's balances as the user's own.
        """
        addresses = []
        for candidate in (part.strip() for part in raw.split(",")):
            if not candidate:
                continue
            if PRIVATE_KEY_RE.match(candidate):
                # Never log the value itself.
                logger.error(
                    "ETH_WALLET_ADDRESSES contains what appears to be a PRIVATE KEY. "
                    "Rejected. This application is read-only and requires public "
                    "addresses only. Treat that key as compromised and rotate it."
                )
                raise ValueError(
                    "ETH_WALLET_ADDRESSES contains a private key. Use public addresses only."
                )
            if not ADDRESS_RE.match(candidate):
                logger.warning("Ignoring malformed Ethereum address: %r", candidate)
                continue
            addresses.append(candidate)
        return addresses

    @property
    def is_configured(self) -> bool:
        return bool(self.rpc_url and self.wallet_addresses)

    def _require_configured(self) -> None:
        if not self.is_configured:
            raise IntegrationNotConfigured(self.name, self.credential_env)

    def _client(self):
        """Lazily build the Web3 client so import never depends on a reachable node."""
        if self._w3 is None:
            from web3 import Web3

            self._w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 20}))
        return self._w3

    async def _call(self, fn, *args):
        """Run a blocking web3 call off the event loop, translating failures."""
        self._require_configured()
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(None, lambda: fn(*args))
        except IntegrationNotConfigured:
            raise
        except Exception as exc:  # noqa: BLE001 - web3 raises a broad, provider-specific set
            logger.warning("Ethereum RPC failure: %s", exc)
            raise IntegrationUnavailable(self.name, str(exc)) from exc

    # ------------------------------------------------------------------ balances

    async def get_balances(self) -> Dict[str, float]:
        """Native ETH plus tracked ERC-20 balances, summed across configured addresses."""
        return await self._call(self._fetch_balances)

    def _fetch_balances(self) -> Dict[str, float]:
        from web3 import Web3

        w3 = self._client()
        if not w3.is_connected():
            raise IntegrationUnavailable(self.name, f"cannot reach RPC endpoint")

        balances: Dict[str, float] = {}

        for address in self.wallet_addresses:
            checksummed = Web3.to_checksum_address(address)

            wei = w3.eth.get_balance(checksummed)
            if wei:
                balances["eth"] = balances.get("eth", 0) + float(Web3.from_wei(wei, "ether"))

            for symbol, token_address in TRACKED_TOKENS.items():
                try:
                    contract = w3.eth.contract(
                        address=Web3.to_checksum_address(token_address), abi=ERC20_ABI
                    )
                    raw = contract.functions.balanceOf(checksummed).call()
                    if not raw:
                        continue
                    decimals = contract.functions.decimals().call()
                    balances[symbol] = balances.get(symbol, 0) + raw / (10 ** decimals)
                except Exception as exc:  # noqa: BLE001 - one bad token must not fail the rest
                    logger.debug("Skipping token %s: %s", symbol, exc)

        return balances

    # ------------------------------------------------------------------ history

    async def get_transactions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Recent ERC-20 transfers involving the configured addresses.

        Bounded by design — see scanner.scan_transfers. The window is reported alongside the
        results so callers do not mistake this for complete history.
        """
        from app.services.blockchain.scanner import scan_transfers

        transfers = await self._call(
            scan_transfers, self._client(), self.wallet_addresses, DEFAULT_SCAN_BLOCKS
        )
        transfers.sort(key=lambda t: t.get("timestamp") or 0, reverse=True)
        return transfers[offset:offset + limit]

    async def get_historical_balances(self, days: int = 30) -> List[Dict[str, Any]]:
        """Not supported.

        Previously returned a fabricated series built with random.uniform. Reconstructing real
        daily balances means replaying transfer history against block timestamps, which
        belongs with the cost-basis work rather than being faked here.
        """
        raise NotImplementedError(
            "Historical Ethereum balances require replaying transfer history; "
            "they are not synthesised."
        )
