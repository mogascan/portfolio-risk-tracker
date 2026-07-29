# Project Review — Crypto Portfolio Tracker

**Date:** 2026-07-28
**Reviewer:** Claude Code (Opus 5)
**Purpose:** Baseline review before completing the build. Also intended as the handoff
document for a Codex second opinion (`/codex:adversarial-review`).

---

## 1. Git state

The repo was never disconnected. `origin` is correctly set:

```
origin  https://github.com/mogascan/crypto-portfolio-tracker.git
```

What is actually broken is **GitHub authentication**, not the remote:

- `gh auth status` → `The token in keyring is invalid` for account `mogascan`
- `git fetch` → `Invalid username or token. Password authentication is not supported`

**Fix (requires a human, interactive):**

```bash
gh auth login -h github.com          # then: git fetch origin
```

### Local vs remote divergence

Local `main` is **4 commits behind** `origin/main` (per last-known refs; a real
`fetch` may reveal more). Local is 0 commits ahead.

Commits present on remote but not local:

| Commit | Subject |
|---|---|
| `a4cd8439` | Update README.md |
| `3f7e2d28` | Financial crises timeline + leadership analysis, news integration, UI |
| `106fd859` | Update README.md |
| `71bbbe46` | chore: remove Node.js installer package and ignore .pkg files |

That is **~9,000 lines of frontend work not present locally**, including
`IntegratedDashboard.jsx` (1,888 lines), `TokenUnlockAnalyzer.js` (1,100),
`FloatEvaluation.js` (938), `StrategicTimelineComponent.jsx` (818),
`LeadershipCrises.jsx` (680), and a large `Watchlist.js` expansion.

### The 240 "modified" files were mostly noise

`git status` showed 240 modified files. **235 are permission-only changes**
(`100644 → 100755`), zero content diff — an artifact of the project being copied.

Evidence the project was moved: `backend/venv/pyvenv.cfg` referenced
`/Users/sedwyer/Desktop/Projects-2025/skittles/...`, which no longer exists.

Only **5 files** had real content changes (see §2 and §3).

---

## 2. What was broken — and fixed in this session

### 2.1 Frontend did not compile (blocking)

`frontend/src/components/Portfolio/DashboardSummary.js` was **17,637 lines: the same
~1,362-line file duplicated 13 times.** Build error:

```
Syntax error: Identifier 'React' has already been declared. (1288:7)
```

This was **local working-tree corruption only** — the committed version at `HEAD` is a
clean 1,361 lines with a single React import.

Blocks 2–13 were byte-identical to each other and to `HEAD`. Block 1 (lines 1–1287)
differed: it *removed* 82 lines and three functions (`findRiskiestAsset`,
`getPositionColor`, `getRiskIndicator`) — a stale older draft, not new work.

**Fixed:** restored from `HEAD` via `git checkout`. The corrupt file is preserved at
`<scratchpad>/DashboardSummary.CORRUPT.bak.js` if block 1 needs a second look.

### 2.2 Backend could not start (blocking)

Two imported modules were **missing from `requirements.txt`**:

- `spacy` — `app/services/ai/utils/keyword_extractor.py:7`
- `PyPDF2` — `app/services/context_loader.py:4`

`spacy.load("en_core_web_sm")` runs at **module import scope** (line 124), so the
language model is also a hard startup dependency, not just the package.

**Fixed:** both added to `requirements.txt` (with a note about the model download),
and installed.

### 2.3 Python venv was dead

`backend/venv/bin/python` was a 10-byte plain file — a symlink flattened by the
copy — pointing at a Homebrew path from the old `Desktop/Projects-2025` location.

**Fixed:** rebuilt from `python3.13` and reinstalled all dependencies.

### 2.4 Test suite could not be collected

`backend/tests/test_ai_pipeline.py` ended with a stray markdown code fence
(` ``` ` on line 364) left over from a paste — a hard `SyntaxError` that broke
collection for the **entire** suite.

**Fixed:** removed the fence.

---

## 3. What is still broken (not fixed — needs decisions)

### 3.1 Test failures (real logic bugs)

Suite now runs from `backend/`: **14 passed, 5 failed, 3 errors.**

| Test | Cause |
|---|---|
| `test_news_query_intent_classification` | Classifier returns `GENERAL_QUERY`, expected `NEWS_QUERY` |
| `test_portfolio_intent_classification` | Classifier returns `GENERAL_QUERY`, expected `PORTFOLIO_ANALYSIS` |
| `test_extract_keywords_with_special_characters` | Keyword extraction fails on special characters |
| `test_openai_service_initialization` | Reads the **real** key from `.env` instead of the injected `test_key` — test-isolation bug |
| `test_mock_provider_failure` | Assertion failure in fallback path |
| 3 errors in `test_ai_context.py`, `test_context_protection.py`, `test_query.py` | `async def functions are not natively supported` — `pytest-asyncio` installed but `asyncio_mode` never configured; `test_query.py` also has a `fixture 'query' not found` |

The two intent-classification failures are the most substantive: the AI assistant's
intent routing — a headline feature in the README — is measurably not working.

### 3.2 Tests must be run from `backend/`

From the repo root, every test errors with `ModuleNotFoundError: No module named 'app'`.
There is no `conftest.py`, `pytest.ini`, or `pyproject.toml` setting `rootdir`/`pythonpath`.

### 3.3 Secret hygiene

`backend/.env` contains a **live OpenAI service-account key** in plaintext.

Good news: `.env` is correctly gitignored and **was never committed** — nothing leaked
to GitHub. But the key is printed into pytest output on failure (see §3.1), so it will
land in any CI log. Rotating it is cheap insurance.

### 3.4 An 80 MB Node installer is committed to the repo

`backend/app/services/ai/node-v22.14.0.pkg` — 80 MB. `.git` is 125 MB as a result.

Remote commit `71bbbe46` already removed it and added a `.pkg` ignore rule, so pulling
resolves the working tree. Purging it from history is a separate, more invasive job.

### 3.5 Duplicate route registration

Both of these are declared, and they are the same path — only the first registered wins:

```
/api/v1/market/price/{coin_id}
/api/v1/market/price/{symbol}
```

### 3.6 Dead and shadowed code

In Python, a package directory shadows a same-named module. These four `.py` files are
**unreachable** — `services/ai/`, `services/news/`, etc. win:

| Shadowed file | Lines |
|---|---|
| `app/services/database.py` | 741 |
| `app/services/ai.py` | 547 |
| `app/services/market_data.py` | 167 |
| `app/services/news.py` | 22 |

**~1,477 lines of dead code.** Also dead:

- `app/core/config.py` — 0 bytes, zero importers
- `app/db/models.py` — 0 bytes, but `services/__init__.py` imports the DB layer when `USE_DATABASE=True`
- `app/tempCodeRunnerFile.py`
- `app/api/v1/ai.py.bak`, `app/prompts/prompt_registry.py.bak`

### 3.7 Split-brain configuration

Three config modules, two of them live:

| Module | Lines | Importers |
|---|---|---|
| `app/config.py` | 31 | 4 |
| `app/core/settings.py` | 47 | 4 |
| `app/core/config.py` | 0 | 0 (dead) |

Two competing app entry points also exist: `app/main.py` and `app/simple_server.py`.

### 3.8 Persistence is undecided

README says "SQLite (planned) or JSON flat files". Reality: JSON flat files are what
runs, `app/data/crypto.db` exists, `db/models.py` is empty, and `USE_DATABASE` defaults
to `False`. The DB layer is a stub gated behind a flag that is never turned on.

### 3.9 An abandoned half-built feature: "specific coins"

A complete vertical slice exists except for the one piece that connects it — the API
route. All files are **untracked** and **imported by nothing**:

| File | Lines | Status |
|---|---|---|
| `backend/app/services/market/specific_coins_service.py` | 272 | untracked, never imported |
| `frontend/src/contexts/SpecificCoinsContext.js` | 111 | untracked, never imported |
| `frontend/src/hooks/useExtendedSearch.js` | 50 | untracked, never imported |
| `data/specific_coins.json` | — | untracked |

Both frontend files call `GET /api/v1/market/specific-coins`, which **returns 404** —
the route was never registered.

Two more orphans, also untracked and imported by nothing:
`frontend/src/components/Portfolio/AddTransactionModal.js` (158),
`frontend/src/components/Portfolio/EditAssetModal.js` (156).

### 3.10 `useExtendedSearch.js` hardcodes `http://localhost:8000`

It bypasses `config.js` entirely. Nine frontend files hardcode a localhost URL; this one
does so inside a hook rather than reading `apiBaseUrl`. Nothing will work when deployed.

### 3.11 Port inconsistency

| Source | Port |
|---|---|
| Root `package.json` `start:backend` | **5001** |
| `frontend/src/config.js` (and 11 call sites) | **8000** |
| `backend/.env.example` `API_PORT` | 8000 |

Following the README's own start command gives you a frontend that cannot reach its backend.

### 3.12 Reddit integration returns 403

```
app.services.news.feed_fetcher - ERROR - Error fetching Reddit posts: Status code 403
```

Reddit now requires an authenticated OAuth app and a descriptive User-Agent. `praw` is
already in `requirements.txt` but the service is fetching unauthenticated.

### 3.13 Frontend build warnings

Build succeeds with **12 lint warnings** — unused imports and variables across
`Portfolio.js`, `RiskAssessment.js`, `RiskAssessment2.js`, `Settings.js`, `Watchlist.js`,
plus two anonymous default exports in `utils/`. Cosmetic, but `Settings.js` has unused
`handleSelectChange` and `handleThemeChange` — handlers that were written and never wired
to their controls, which is a functional gap wearing a lint warning's clothes.

### 3.14 Toolchain risk

`react-scripts@5.0.1` (unmaintained, last release 2022) on **Node v26**. It builds today,
but CRA is deprecated and this pairing is unsupported. `browserslist` data is 17 months stale.

---

## 4. What actually works

Verified by running it, not by reading it:

- **Backend starts** and serves on `:8000`
- **CoinGecko integration is live** — fetched 500 coins across 5 pages, 5-minute refresh loop
- **RSS news works** — CoinDesk (25 items), Google News (68 + 45 items), Decrypt
- **Endpoints return 200:** `/api/docs`, `/api/v1/portfolio`, `/api/v1/portfolio/holdings`,
  `/api/v1/news/crypto`, `/api/v1/market/topcoins`, `/api/v1/news/reddit/{sub}/{sort}`
- **Frontend builds** — 1.4 MB `main.js` emitted
- **40 routes** registered across market / news / AI / portfolio
- **Frontend↔backend contract is otherwise sound** — of 16 endpoints the frontend calls,
  15 exist. The only miss is `specific-coins` (§3.9).

This is not a broken project. It is a working project with a corrupted file, two missing
dependencies, and accumulated cruft.

---

## 5. Recommended sequence

### Phase 0 — Reconnect (blocked on you)

1. `gh auth login -h github.com`
2. `git fetch origin`
3. Re-check divergence — the 4-commit gap is from stale refs and may be larger.
4. **Commit the local fixes first, on a branch**, then merge `origin/main`. Do not pull
   onto a dirty tree — the incoming commits touch `Watchlist.js` and `Settings.js`,
   which have local permission changes.
5. Normalize the chmod noise: `git config core.fileMode false` (or commit the 755s once).

### Phase 1 — Stabilize

6. Add `backend/pytest.ini` with `pythonpath = .` and `asyncio_mode = auto` → fixes §3.2 and 3 errors.
7. Fix `test_openai_service_initialization` to inject a fake key → stops leaking the real one into logs.
8. Rotate the OpenAI key.
9. Fix the two intent-classification bugs — the AI assistant's routing is the product's headline feature.
10. Unify the port on 8000 (fix root `package.json`).

### Phase 2 — Decide, then delete

11. Pick one config module. Delete the other two.
12. Pick `main.py` or `simple_server.py`. Delete the loser.
13. Delete the 4 shadowed modules (~1,477 lines), both `.bak` files, `tempCodeRunnerFile.py`, `core/config.py`.
14. Decide SQLite vs JSON. Either implement `db/models.py` or remove the `USE_DATABASE` branch.
15. Remove the duplicate `/market/price/` route.

### Phase 3 — Finish what was started

16. **Specific coins:** register the route, wire the context into `App.js`, fix the
    hardcoded URL in `useExtendedSearch.js`. It is ~80% built.
17. **Transaction modals:** wire `AddTransactionModal` / `EditAssetModal` into `Portfolio.js`,
    or delete them. Manual asset entry is the README's stated MVP goal — these are that feature.
18. Wire `Settings.js`'s orphaned handlers to their controls.
19. Authenticate Reddit via `praw`.

### Phase 4 — Modernize

20. Migrate CRA → Vite. Removes the Node 26 risk and cuts build times sharply.
21. Add CI: `pytest` + `npm run build` on push. Every issue in §2 would have been caught
    by a build step.

---

## 6. Ideas worth considering

**Highest leverage — a price-refresh WebSocket.** `websockets` is already a dependency
and the market service already runs a 5-minute refresh loop. Push updates instead of
polling; the dashboard goes live for very little new code.

**Cost control on the AI path.** `spacy.load()` at import scope costs ~50 MB RSS and
seconds of startup on every worker. Lazy-load it. Then cache LLM responses by
`(intent, context-hash)` — the README already describes token budgeting, so the
accounting hooks exist.

**Make the tax feature real.** It is listed as a "smart flag" but there is no
cost-basis engine. FIFO/LIFO over `transaction_history.json` is a well-defined,
self-contained unit of work and a genuine differentiator over generic trackers.

**Merge the `financial-crises-history` repo.** `origin/main` already contains
`components/Financial/*` and `LeadershipCrises.jsx`, and there is a *separate*
`financial-crises-history` repo sitting next to this one at `Documents/skittles/`
with 2 commits and no remote. That work is already being absorbed here — finish the
absorption and retire the standalone repo.

**Portfolio correlation matrix.** `RiskAssessment2.js` already computes `correlationData`
and then never renders it (§3.13 flags it as an unused variable). The hard part is done.

---

## 7. Tooling installed this session

| Tool | Status | Notes |
|---|---|---|
| **memsearch** `0.4.16` | Enabled, verified | Project scope for both `skittles/` and `crypto-portfolio-tracker/`. Local ONNX `bge-m3-int8` embeddings — no API key. Index + semantic search smoke-tested end to end. |
| **codex plugin** `1.0.6` | Enabled | Provides `/codex:adversarial-review`, `/codex:review`, `/codex:transfer`, `/codex:rescue`, `/codex:status`, plus a `codex-rescue` agent. Codex CLI `0.145.0` authenticated via ChatGPT tokens. |
| **OpenSpec** `1.3.1` | Initialized | `openspec init --tools claude,codex` — writes skills to **both** `.claude/` and `.codex/`, so both agents follow the same spec workflow. |

### On adopting OpenSpec brownfield

Yes — this is the intended path. OpenSpec does not require specs for existing code.
`openspec/specs/` starts empty and fills in only as you make change proposals; each
proposal writes the spec delta for the slice it touches. Specs accrete where you are
actively working rather than demanding a big-bang documentation effort up front.

The natural first proposal is §3.9 (**specific coins**) — a small, well-bounded,
already-80%-built feature. It exercises the whole loop
(`/opsx:propose` → `/opsx:apply` → `openspec archive`) without much risk.

One caveat: OpenSpec's value depends on specs being written *before* code. This codebase
got where it is partly through fast unspecced iteration — the duplicated file, the orphaned
feature, and the three config modules are all symptoms of that. OpenSpec is a reasonable
corrective, but only if the discipline holds.
