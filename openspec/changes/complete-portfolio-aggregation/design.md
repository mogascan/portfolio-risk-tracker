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

## Credentials: fail loudly, never mock

Current behaviour in `binance.py` / `coinbase.py` is to return mock balances when keys are
unset. This must go.

Contract for every integration:

```
credentials absent  → 503, {"status": "not_configured",
                            "integration": "binance",
                            "required": ["BINANCE_API_KEY", "BINANCE_API_SECRET"]}
credentials present but rejected → 502, {"status": "auth_failed", "integration": ...}
credentials present and working  → 200, real data
```

Typed and machine-readable so the frontend can render "connect your Binance account" rather
than a number the user might act on. A fabricated balance in a financial tool is worse than an
error — it is the one failure mode that could cause real loss.

`/summary` aggregates across sources, so it degrades per source rather than all-or-nothing: it
returns the sources that worked plus an explicit `unavailable` list. A user with only Coinbase
configured sees their Coinbase holdings and a clear statement that Binance and Ethereum are not
connected.

## Settings

All credentials move to `app/core/settings.py` — the settled config module — read via
`os.getenv` with `load_dotenv()`, alongside the existing `COINGECKO_API_KEY`,
`ETHEREUM_RPC_URL` and `ETH_WALLET_ADDRESSES` keys added earlier.

No credential may be logged, and none may reach an error payload. The `required` field above
lists variable *names* only, never values. The suite already proved this matters:
`test_openai_service_initialization` was printing a live key into pytest output.

## On-chain — blocked, and deliberately isolated

`web3` is not installed and not in `requirements.txt`; `eth.py`'s calls are commented out;
`scanner.py` is 0 bytes. This cannot be built without a decision and an RPC URL.

The design isolates it: `EthereumService` conforms to the same interface as the CEX services
(`get_balances`, `get_transactions`), so `/summary` treats "Ethereum not configured" exactly
like "Binance not configured". Everything else in this change ships whether or not the on-chain
question is answered.

## Tax engine

The `/tax` endpoint exists but there is no cost-basis engine — no lot tracking, no disposal
matching, no FIFO/LIFO.

Design, pending the depth decision:

- A `Lot` record per acquisition: asset, quantity, unit cost, timestamp, source
- Disposals consume lots by the configured method (FIFO default, LIFO selectable)
- Output: realised gain/loss per disposal with holding period, plus unrealised P/L on open lots
- Explicitly **estimates**: no wash-sale handling, no jurisdiction rules, no Form 8949
  generation. The UI must say so.

This depends on transaction history, so it is ordered after the exchange integrations. It is
the largest single unit of work in the change and the most reasonable thing to descope.

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
