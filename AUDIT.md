# Phase 0c — Capability audit

**Date:** 2026-07-28
**Purpose:** the factual basis for `openspec/project.md`. Written because reading code alone
misleads in this repository — subsystems here look finished and are switched off.

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
| half-built | 4 | reachable but incomplete, or complete but unwired |
| facade | 2 | real-looking code, no working integration behind it |
| dead | 3 | unreachable; ~330 lines |

---

## Backend — API layer

| Capability | Status | Evidence |
|---|---|---|
| `api/v1/market` | **live** | Registered. Live CoinGecko. Duplicate `/price/` route removed. |
| `api/v1/news` | **live** | Registered. Live feeds. Reddit sub-routes 403 without credentials. |
| `api/v1/ai` | **live** | Registered. Intent classification and keyword extraction both fixed and tested. |
| `api/v1/portfolio` | **live** | Registered. Reads/writes JSON under `backend/data/`. |
| `api/v1/social` | **live** | Registered via `social/__init__.py`. |
| **`app/routes/`** | **dead** | **194 lines.** `ai.py` (51) and `crypto_data.py` (143) both define `APIRouter`, neither is imported anywhere. A *third* parallel route tree — `app/api/routes/` was already deleted this session for the same reason. |

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

Two corrections to the plan's own inventory:

- The plan lists "4 unregistered routers". After deleting `app/api/routes/`, the remaining
  unregistered routers are the 2 in `app/routes/`.
- The plan describes `eth.py`'s web3 as "commented out" — accurate, and additionally `web3` is
  absent from `requirements.txt`, so it could not run even uncommented.

**Nothing here has been deleted.** Removal of the ~330 dead lines is a separate change, and
the exchange facade is a product decision — that code works and is two lines from being live.
