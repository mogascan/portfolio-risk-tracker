# Design — portfolio aggregation

## Mounting the router

`app/api/routes/portfolio.py` declares a bare `APIRouter()` with `/summary`, `/performance`,
`/assets`, `/transactions`, `/tax`.

`app/api/v1/portfolio.py` is already registered with `prefix="/portfolio"` and owns `""`,
`/holdings`, `/transactions`, `/watchlist`, `/holdings/update`, `/transaction`, `/watchlist`,
`/watchlist/update`.

**`/transactions` exists in both.** Mounting the aggregation router under `/portfolio` would
shadow one of them — FastAPI matches the first registration and the second becomes dead, which
is precisely the defect class this project keeps producing.

**Decision:** mount at `prefix="/accounts"`, giving `/api/v1/accounts/{summary,performance,
assets,transactions,tax}`. The name reflects what it is — aggregation across connected
accounts — and leaves the manual-portfolio API untouched. The two are genuinely different
capabilities: `v1/portfolio` is the user's hand-entered holdings, `accounts` is what the
exchanges and wallets report.

Reconciling the two into one view is explicitly **out of scope** here and gets its own change.
They are two sources of truth today; naming them separately makes that visible rather than
hiding it behind a merged endpoint.

## Exchanges: Coinbase and Kraken

Decided 2026-07-28: **Coinbase and Kraken only. No Binance.**

`coinbase.py` exists (173 lines, real ccxt) and needs its imports uncommented and the mock
fallback removed. `kraken.py` **does not exist** and must be written — ccxt exposes `kraken`,
so it mirrors `coinbase.py` against the same `base.py` interface.

`binance.py` stays on disk, untouched and unwired. It is 180 lines of *working* code, so this
is a product decision, not a cleanup of something broken. Removing it, its ten file
references, and the now-unused `python-binance==1.0.19` pin is a separate change.

All services conform to `base.py` (`get_balances`, `get_transactions`), so adding or dropping
a source is a registration change rather than a rewrite of the aggregator.

## Credentials: fail loudly, never mock

Current behaviour in `coinbase.py` is to return mock balances when keys are unset. This must
go.

Contract for every integration:

```
credentials absent  → 503, {"status": "not_configured",
                            "integration": "kraken",
                            "required": ["KRAKEN_API_KEY", "KRAKEN_API_SECRET"]}
credentials present but rejected → 502, {"status": "auth_failed", "integration": ...}
credentials present and working  → 200, real data
```

Typed and machine-readable so the frontend can render "connect your Kraken account" rather
than a number the user might act on. A fabricated balance in a financial tool is worse than an
error — it is the one failure mode that could cause real loss.

`/summary` aggregates across sources, so it degrades per source rather than all-or-nothing: it
returns the sources that worked plus an explicit `unavailable` list. A user with only Coinbase
configured sees their Coinbase holdings and a clear statement that Kraken and Ethereum are not
connected.

## Settings

All credentials move to `app/core/settings.py` — the settled config module — read via
`os.getenv` with `load_dotenv()`, alongside the existing `COINGECKO_API_KEY`,
`ETHEREUM_RPC_URL` and `ETH_WALLET_ADDRESSES` keys added earlier.

No credential may be logged, and none may reach an error payload. The `required` field above
lists variable *names* only, never values. The suite already proved this matters:
`test_openai_service_initialization` was printing a live key into pytest output.

## On-chain — build for real

Decided 2026-07-28: **implement Ethereum properly.** Not descoped.

This is the one genuinely greenfield part of the change. `web3` is not installed and not in
`requirements.txt`, every call in `eth.py` is commented out, and `scanner.py` is 0 bytes — so
"finish the wiring" does not apply here. Scope it as new work:

- Add `web3` to `requirements.txt`. It ships wheels for Python 3.13, unlike the `pandas` pin
  that broke CI, but verify that in CI rather than assuming it.
- Implement `get_balances` against `ETHEREUM_RPC_URL` for each address in
  `ETH_WALLET_ADDRESSES` — native ETH first, then ERC-20 via balance calls.
- Implement `get_transactions`. An RPC node alone cannot answer "all transactions for an
  address" efficiently; that needs either log scanning over a block range (`scanner.py`) or an
  indexing API. **Prefer scanning a bounded recent range** over adding a second provider
  dependency, and state the range limit in the response rather than implying completeness.
- Public addresses only. Never accept a private key or seed phrase.

`EthereumService` keeps the same interface as the CEX services (`get_balances`,
`get_transactions`), so `/summary` treats "Ethereum unavailable" exactly like "Kraken not
configured", and an RPC outage degrades one source rather than the endpoint.

## Tax engine

The `/tax` endpoint exists but there is no cost-basis engine — no lot tracking, no disposal
matching, no FIFO/LIFO.

Decided 2026-07-28: **a real cost-basis engine.** FIFO and LIFO, with disposal matching. Not
"estimates".

- A `Lot` record per acquisition: asset, quantity, unit cost, timestamp, source
- Disposals consume lots by the configured method — **FIFO default, LIFO selectable**
- Output per disposal: realised gain/loss, holding period, and which lots were consumed
- Plus unrealised P/L on lots still open

Design constraints that follow from doing it properly:

- **Deterministic and pure.** The matcher takes lots plus disposals and returns results — no
  network, no clock. That is what makes it testable, and it is the one part of this change
  that can be verified exactly rather than approximately.
- **Ordering matters.** Disposals must be applied in timestamp order; out-of-order input
  silently changes which lots are consumed and therefore the realised figure.
- **Insufficient lots is an error, not a zero.** Disposing more than was acquired means the
  history is incomplete — say so rather than inventing a basis.
- **Precision.** Use `Decimal`, not float. Repeated float arithmetic over many lots drifts,
  and this output is what a user files taxes from.

Still out of scope, and the UI must say so: no wash-sale handling, no jurisdiction-specific
rules, no Form 8949 generation. "Real engine" means the arithmetic is correct and auditable,
not that it constitutes tax advice.

Depends on transaction history, so it sequences after the exchange and on-chain integrations.
It is the largest single unit of work in this change.

## Specific coins

Four routes the frontend already calls and the backend does not have: `/api/symbols`,
`/api/symbols/refresh`, `/api/symbols/alert-setup`, `/api/token/`.

These belong with market data, not aggregation. They are in this change only because the seam
table assigns backend routes to Claude Code — the frontend half is Codex's change, and the two
must land in the right order: **backend routes first**, then the client. Shipping the client
against absent routes is how the current breakage happened.

## Testing

Per the gate, each capability needs a test that fails if it is removed:

| Capability | Test |
|---|---|
| Router registered | Assert `/api/v1/accounts/summary` resolves — fails if the `include_router` line is deleted |
| Not-configured path | With no env vars, assert 503 and the `not_configured` shape — fails if a mock fallback returns |
| Aggregation | Fake services returning known balances; assert summed value and per-asset breakdown |
| Partial availability | One source configured, one not; assert working data plus the `unavailable` list |
| Cost basis | Known lot sequence; assert FIFO and LIFO produce the expected, and different, realised figures |

CI runs without secrets, so every test exercises the not-configured and fake-service paths.
Live-credential verification is manual and recorded, not automated.
