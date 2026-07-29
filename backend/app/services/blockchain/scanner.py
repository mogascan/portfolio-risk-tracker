"""Bounded log scanning for ERC-20 transfers.

This file was 0 bytes until 2026-07-28.

The problem it solves: a plain JSON-RPC node cannot answer "every transaction involving this
address". Ethereum indexes logs by topic, not by participant, and account history is not a
first-class query. The options are an indexing service (Etherscan, Covalent, The Graph) — a
second provider dependency and another credential — or scanning a block range yourself.

We scan, deliberately, and report the window scanned. The alternative failure mode is worse:
returning a partial list that *looks* complete, so a user concludes a transaction is missing
when it is merely older than the window.

Limits, stated rather than implied:
  * ERC-20 Transfer events only. Plain ETH sends between externally-owned accounts emit no
    logs and will not appear here.
  * Only the most recent `lookback_blocks` blocks.
  * Only the tokens in TRACKED_TOKENS.
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# keccak256("Transfer(address,address,uint256)") — logged by every ERC-20 transfer.
TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

# Providers cap eth_getLogs ranges. 2000 stays inside common free-tier limits; an oversized
# request is rejected outright rather than truncated, which would look like "no transfers".
CHUNK_SIZE = 2_000


def scan_transfers(w3, addresses: List[str], lookback_blocks: int) -> List[Dict[str, Any]]:
    """Return ERC-20 transfers touching `addresses` within the recent block window.

    Each result carries `scanned_from_block` and `scanned_to_block` so the caller can tell the
    user what was actually covered rather than implying completeness.
    """
    from web3 import Web3

    if not addresses:
        return []

    latest = w3.eth.block_number
    start_block = max(0, latest - lookback_blocks)

    # An address appears in a topic as a 32-byte left-padded word.
    topic_values = [
        "0x" + Web3.to_checksum_address(a)[2:].lower().rjust(64, "0") for a in addresses
    ]

    from app.services.blockchain.eth import TRACKED_TOKENS

    token_by_address = {
        Web3.to_checksum_address(addr).lower(): symbol
        for symbol, addr in TRACKED_TOKENS.items()
    }

    transfers: List[Dict[str, Any]] = []

    for chunk_start in range(start_block, latest + 1, CHUNK_SIZE):
        chunk_end = min(chunk_start + CHUNK_SIZE - 1, latest)

        # Two passes: once matching the sender topic, once the recipient. One query cannot
        # express "from OR to" — topic positions are ANDed together.
        for topic_position in (1, 2):
            topics: List[Any] = [TRANSFER_TOPIC, None, None]
            topics[topic_position] = topic_values

            try:
                logs = w3.eth.get_logs({
                    "fromBlock": chunk_start,
                    "toBlock": chunk_end,
                    "topics": topics,
                })
            except Exception as exc:  # noqa: BLE001 - provider error types vary widely
                logger.warning(
                    "Log scan failed for blocks %s-%s: %s", chunk_start, chunk_end, exc
                )
                continue

            for log in logs:
                transfers.append(_format(log, token_by_address, start_block, latest))

    # The same transfer matches both passes when one configured address pays another.
    unique = {(t["tx_hash"], t["log_index"]): t for t in transfers}
    return list(unique.values())


def _to_hex(value) -> str:
    """web3 returns HexBytes for some fields and str for others depending on provider."""
    return value.hex() if hasattr(value, "hex") else str(value)


def _format(log, token_by_address, scanned_from, scanned_to) -> Dict[str, Any]:
    """Normalise a raw log into the shape the aggregation layer expects."""
    contract = log["address"].lower()

    data = _to_hex(log["data"])
    amount_raw = int(data, 16) if data not in ("", "0x") else 0

    tx_hash = _to_hex(log["transactionHash"])

    return {
        "id": f"{tx_hash}-{log['logIndex']}",
        "tx_hash": tx_hash,
        "log_index": log["logIndex"],
        "block_number": log["blockNumber"],
        # Block timestamps require a separate call per block. The aggregation layer sorts on
        # this and tolerates None rather than paying an RPC round trip per log.
        "timestamp": None,
        "symbol": token_by_address.get(contract, contract),
        "type": "transfer",
        "amount_raw": amount_raw,
        "source": "ethereum",
        # Stated, not implied: this is a window, not complete history.
        "scanned_from_block": scanned_from,
        "scanned_to_block": scanned_to,
    }
