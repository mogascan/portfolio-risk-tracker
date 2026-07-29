# Phase 0c — Capability audit

**Date:** 2026-07-28 · **Updated:** 2026-07-29 after implementation
**Purpose:** the factual basis for `openspec/project.md`. Written because reading code alone
misleads in this repository — subsystems here look finished and are switched off.

---

## Status after implementation (2026-07-29)

The aggregation change is implemented. What moved:

| Capability | Was | Now |
|---|---|---|
| Portfolio aggregation | half-built, unregistered | **live** — `/api/v1/accounts/*` |
| CEX (Coinbase, Kraken) | facade / nonexistent | **live** — real ccxt, Kraken newly written |
| On-chain Ethereum | facade, `web3` absent | **live** — real RPC, `scanner.py` written |
| Golden/death-cross alerts | 3/4 missing, no receiver | **live** — webhook + symbol mapping |
| Token supply data | route absent | **live** — `/api/v1/token/{id}` |
| Tax | hardcoded zeros | **live** — FIFO/LIFO cost-basis engine |
| Dark mode | broken at 52 sites | **fixed** — pending visual confirmation |

**Tests: 19 → 109.** flake8 0. Frontend build clean.

### Fabricated data on default paths — eliminated

The audit's central finding was code that looked finished and was switched off. Implementation
surfaced a second, worse pattern: code that looked finished and returned **invented financial
data**.

| Location | Was | Now |
|---|---|---|
| `coinbase.py` | 0.05 BTC, 1 ETH, 2000 USDC when unconfigured | raises `not_configured` |
| `coingecko.get_prices` | BTC $40,000 hardcoded; **`random.uniform(0.1, 100)`** for unknowns | raises `unavailable` |
| `coingecko.get_market_data` | mock market on rate limit | raises `unavailable` |
| `eth.py` | mock balances, mock transactions, `random.uniform` history | real RPC or raises |
| `eth.py` wallets | defaulted to two hardcoded addresses | no fallback |
| `/tax` | hardcoded zeros, reading as "you owe nothing" | real engine or 422 |

Verified after: no `_get_mock*` call is reachable from any registered route. The remaining ones
are in `binance.py` (deliberately unwired) and `services/ai/portfolio_analysis.py` (orphaned —
the live `services/portfolio/portfolio_analysis.py` has none).

### Silent arithmetic bugs found during implementation

- **Balances were discarded.** `{**coinbase, **ethereum}` drops the earlier value on a key
  collision — 1 BTC on two exchanges reported 1 BTC. Invisible with one exchange wired.
- **Unpriced assets vanished** from `/summary` rather than showing as unpriced.
- **`extract_keywords` was defined twice** in `api/v1/ai.py`; the route handler shadowed a
  60-line helper.

Every capability was checked against five questions:

1. **Reachable?** — registered route, imported module, rendered component
2. **Real data by default?** — or a mock fallback on the default path
3. **Deps installed?** — or commented out, as in `eth.py`
4. **Tested?** — does any test exercise it
5. **Shadowed?** — does a same-named package hide it

Classification: **live** / **half-built** / **facade** / **dead**.

---

## Summary

| Status | Count | Meaning |
|---|---|---|
| live | 5 | reachable, real data, working |
| half-built | 6 | reachable but incomplete, or complete but unwired |
| facade | 2 | real-looking code, no working integration behind it |
| dead | 2 | unreachable; ~85 lines |

**The dominant finding is not dead code — it is written-and-switched-off code.** Roughly 900
lines across `api/routes/`, `routes/`, `services/exchanges/` and `services/blockchain/` are
the portfolio-aggregation capability from the planning documents. They are unreachable only
because no router is registered in `main.py`. Per plan line 570 this is **spec work, not
cleanup**: finishing it is a wiring problem, materially cheaper than a greenfield build.

---

## Backend — API layer

| Capability | Status | Evidence |
|---|---|---|
| `api/v1/market` | **live** | Registered. Live CoinGecko. Duplicate `/price/` route removed. |
| `api/v1/news` | **live** | Registered. Live feeds. Reddit sub-routes 403 without credentials. |
| `api/v1/ai` | **live** | Registered. Intent classification and keyword extraction both fixed and tested. |
| `api/v1/portfolio` | **live** | Registered. Reads/writes JSON under `backend/data/`. |
| `api/v1/social` | **live** | Registered via `social/__init__.py`. |
| **`app/api/routes/`** | **half-built** — *do not delete* | **344 lines.** `portfolio.py` (190) imports `BinanceService`, `CoinbaseService`, `EthereumService` and `CoinGeckoService` and exposes `/summary`, `/performance`, `/assets`, `/transactions`, `/tax` — this **is** the documented MVP acceptance test. `auth.py` (154) alongside it. Unregistered in `main.py`, which is the only reason it does nothing. Deleted in error earlier this session and restored; plan line 570 names it explicitly as spec work, not cleanup. |
| **`app/routes/`** | **half-built** — *do not delete* | **194 lines.** `ai.py` (51) and `crypto_data.py` (143) both define `APIRouter`, neither imported. A third parallel route tree. Covered by the same plan line 570 reclassification as the pair above — unregistered, not dead. |

## Backend — models

| Capability | Status | Evidence |
|---|---|---|
| Pydantic API models | **live** | Imported throughout `api/v1/`. |
| **`app/models/ai.py`** | **dead** | **85 lines, shadowed.** `app/models/ai/` is a package, so the directory wins and the module can never be imported. Both define the same 5 class names, but the implementations differ (85 lines vs the package's 34). The richer one is the unreachable one. Same defect class as the four service modules deleted earlier. |
| `models/entities.py` | **half-built** | SQLAlchemy ORM, imported by `models/__init__`, but none of its 11 entity classes is referenced anywhere. Retained deliberately — SQLite is the decided direction. |

## Backend — services

| Capability | Status | Evidence |
|---|---|---|
| `services/market_data/` | **live** | Real CoinGecko client. |
| `services/news/` | **live** | Live feeds. |
| `services/ai/` | **live** | Reachable via `api/v1/ai`; spaCy model loads at import scope. |
| `services/exchanges/` | **facade** | 374 lines of **real ccxt code** (`ccxt` 4.2.15 *is* installed, `ccxt.binance({...})` is genuine). But the only importer, `services/ai/portfolio_analysis.py`, has both imports **commented out** at lines 9–10. Working code, wired to nothing. |
| `services/blockchain/` | **facade** | `eth.py` is 238 lines, but every `web3` call is commented out (lines 17–21) and **`web3` is not installed and not in `requirements.txt`**. `scanner.py` is 0 bytes. It imports cleanly only because the real integration was removed. |
| `services/database/` | **half-built** | 933 lines. `db_service` is instantiated in `services/__init__` and **never called**. `USE_DATABASE` defaults False, aliasing it to `MockDatabaseService`. Kept per the SQLite decision. |
| `services/context_loader.py` | **dead** | Reads `app/data/research/`, a directory purged from the repo. Its only caller, `prompts/prompt_builder.py`, is itself unimported. |

## Backend — persistence

| Capability | Status | Evidence |
|---|---|---|
| JSON flat files | **live** | `data/portfolio/user_portfolio_holdings.json` and `user_watchlist.json` are what the app actually reads and writes. |
| SQLite | **half-built** | `data/crypto_portfolio.db` has a complete 10-table schema and **0 rows in every table**. `db/models.py` is 0 bytes. Decided direction, unimplemented. |

## Frontend

| Capability | Status | Evidence |
|---|---|---|
| Dashboard / Markets / News / Portfolio | **live** | Routed and rendered. |
| `PortfolioContext` | **half-built** | localStorage-backed — a **second source of truth** alongside the backend's JSON store. Nothing reconciles them. |
| Specific-coins client | **dead** | The frontend calls `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup` and `/api/token/` — **none of these routes exist in the backend.** `hooks/useExtendedSearch.js` is unimported. |
| Transaction modals | **live** *(as of this session)* | `AddTransactionModal` and `EditAssetModal` wired into `AssetList`; `addTransaction` implemented in `PortfolioContext`. |
| Dark mode | **half-built** | 37 of 52 `theme.colorScheme` sites fixed. 21 remain in `App.js`'s `createTheme` and two `sx` blocks — both patterns removed in Mantine 7. |

---

## What this changes

Three items are newly discovered and were not in the plan's list:

- **`app/models/ai.py`** — a fresh instance of the package-shadows-module defect the settled
  decisions already name. 85 lines, unreachable.
- **`app/routes/`** — a third dead route tree, 194 lines.
- **`services/exchanges/`** — genuinely working ccxt code, disabled only by two commented-out
  import lines. Closer to shipping than anything else in the dead/facade set.

One correction to the plan's inventory:

- The plan describes `eth.py`'s web3 as "commented out" — accurate, and additionally `web3` is
  absent from `requirements.txt`, so it could not run even uncommented. The CEX half
  (`binance.py`, `coinbase.py`) is genuinely functional; the on-chain half is not.

## A deletion that should not have happened

`app/api/routes/` was deleted earlier in this session as "a dead parallel route tree." The
reasoning was locally correct — nothing imported it — but it contradicted plan line 570,
which names those routers explicitly:

> **Do not delete — reclassified.** These are not dead code, they are the half-built
> portfolio-aggregation capability. This is spec work, not cleanup work.

Restored in full, 344 lines, byte-identical. Verified after restoring: flake8 0, 23 passed,
`app.main` imports.

The lesson generalises, and belongs in the spec: **"nothing imports it" is not sufficient
evidence for deletion in this repository**, because being unimported is the defining symptom
of its main defect rather than a sign of redundancy.
