# Project — AI-Powered Crypto Portfolio Tracker

**Seeded:** 2026-07-28, from `skittles/Documents/` (Ideation, Planning, Research,
architecture diagram, Asset Evaluation worksheet) and the Phase 0c audit in `AUDIT.md`.

This file records what the product **is**, and what each capability's status **actually is** —
not what the code appears to do. It is seeded from the planning documents rather than written
fresh, because the documents already contain a detailed, opinionated spec. The problem was
never a lack of planning. It was that nothing kept the code tethered to it.

---

## MVP acceptance test

From the planning documents, verbatim:

> "You connect your Binance, Coinbase, and a few Ethereum wallets. The MVP displays unified
> holdings, trend graph, provides basic P/L tracking, allows quick AI queries… and helps with
> basic tax estimates."

**This does not currently pass.** The reason matters: it is not unbuilt. The aggregation layer
exists, is largely written, and is switched off — see [The central pattern](#the-central-pattern).

---

## Non-goals

Explicit, and not up for reinterpretation in a change proposal:

- **No custody.** The application never holds funds.
- **No private keys.** Never requested, stored, or transmitted.
- **Read-only exchange keys only.** No trade execution.
- **Single user.** No multi-tenancy, no user accounts beyond local use.
- **Not financial advice.** AI output is analysis, never a recommendation to transact.
- **No Twitter/X feed.** Decided 2026-07-28. The planning documents name Twitter as the
  "Water Cooler" social source; that is **dropped**, not deferred. Do not build, extend, or
  re-add it. Reddit remains the social source.

  Note the existing state: `services/news/twitter_service.py` (433 lines) is instantiated in
  `services/news/__init__.py` and `GET /api/v1/news/twitter/user/{handle}` is registered and
  reachable. No frontend component calls it, and it is gated on an unset
  `TWITTER_BEARER_TOKEN`. Removing it is a separate change — this entry stops it being
  *built on*, and prevents a future audit reclassifying it as work to finish.

---

## The central pattern

Every major defect found so far is one instance of a single failure mode:

1. Written to a plausible shape, often with real integration code
2. Never wired into `main.py`, so unreachable
3. Mock fallbacks added "for now" and never replaced
4. No tests, so nothing ever failed
5. Because it is unreachable, **nothing ever surfaced the incompleteness** — the code reads as
   done and behaves as absent

This produced a market-data app with a manual portfolio, while the documented aggregation sat
on disk, complete enough to be misleading. Naming the pattern is the point of this file.

**Consequence for cleanup:** "nothing imports it" is *not* sufficient evidence for deletion
here. Being unimported is the symptom of the defect, not proof of redundancy. This was learned
the hard way — `app/api/routes/` was deleted during Phase 0a and had to be restored.

---

## Definition of done — blocking gate

A capability may **not** be described as done unless all three hold:

1. It is **reachable** — a registered route, an imported module, or a rendered component.
2. Its default path returns **real data**. No mock fallback. Mocks live behind an explicit
   flag only.
3. **At least one test fails if it is removed.**

This is a gate, not advice. It is the rule that would have caught `api/routes/portfolio.py`,
`simple_server.py`, the four shadowed service modules, the specific-coins work, and
`test_search.py` — which for months asserted nothing and passed regardless.

---

## Capability status

Authoritative as of the Phase 0c audit. Full evidence in `AUDIT.md`.

### Live

| Capability | Notes |
|---|---|
| Market data | CoinGecko free/public API. Registered, real data. |
| News (crypto, macro) | Live feeds. Reddit sub-routes 403 pending credentials. |
| AI assistant | Intent classification and keyword extraction; both had real bugs, both now tested. |
| Manual portfolio | JSON-backed; add/edit/transaction modals wired. |
| Social | Registered. |

### Half-built — written, unreachable

| Capability | Gap |
|---|---|
| **Portfolio aggregation** | `api/routes/portfolio.py` exposes `/summary`, `/performance`, `/assets`, `/transactions`, `/tax`, importing all four services. **Never registered in `main.py`.** This is the MVP acceptance test, one router registration away from reachable. |
| **CEX integration** | `services/exchanges/{binance,coinbase}.py` — 374 lines of real ccxt (`ccxt` 4.2.15 installed). Disabled by two commented-out imports in `portfolio_analysis.py`. |
| `routes/{ai,crypto_data}.py` | 194 lines, unregistered. |
| SQLite persistence | Decided; `db/models.py` empty; the DB has a 10-table schema and 0 rows. JSON is the legacy path being migrated from. |
| Specific coins | Frontend calls `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup`, `/api/token/` — **none exist server-side.** |
| Dark mode | 21 of 52 Mantine v6 sites remain, in `App.js`'s `createTheme` and two `sx` blocks. |

### Facade — looks real, no integration behind it

| Capability | Reality |
|---|---|
| **On-chain / Ethereum** | `blockchain/eth.py` is 238 lines with every `web3` call commented out. `web3` is **not installed and not in `requirements.txt`**. `scanner.py` is 0 bytes. Mock data at every path. |
| Tax | A first-class box in the architecture diagram; in code it is prompt text plus the unregistered `/tax` endpoint. No cost-basis engine, no FIFO/LIFO, no Form 8949. |

### Dead

| Item | Notes |
|---|---|
| `app/models/ai.py` | 85 lines, shadowed by `app/models/ai/`. Unreachable. |
| `services/context_loader.py` + `prompts/prompt_builder.py` | Read a directory purged from the repo; neither is imported. |

---

## Documented vs built — known drift

| Documented | Built |
|---|---|
| Nine named modules (Fort Knox wallets, Cash Register tax, Oppenheimer research, Area 51 strategy, Ward trading psychology, Water Cooler social, …) | A subset; several exist only as page shells |
| `pro.x.com`-style three-column workspace, AI prompt centred | Page-router app — **accepted baseline**, see below |
| Covalent primary, The Graph secondary, ccxt for CEX | CoinGecko only; ccxt present but unreachable |
| SQLite or PostgreSQL | JSON flat files — never named as a design choice in any document |
| Twitter for "Water Cooler" | Reddit, currently 403. **Twitter is now dropped from scope** — see non-goals. |
| Tax calculator as a backend component | Prompt text only |

Built but in **no** document: TokenUnlockAnalyzer, RiskAssessment (×2), Watchlist, Markets,
golden-cross analysis, Reddit feeds, Docker, Redis.

Not drift, despite appearances: `AssetEvaluation.js` is specified by
`Documents/Asset Evaluation.jpg`, and `Documents/calendar/` holds import fixtures for
`EventImporter.js` implementing the seasonality module.

---

## Settled decisions

Closed. Do not re-litigate in a proposal; to revisit one, say so and get a decision first.

| Decision | Value |
|---|---|
| Backend entry point | `backend/app/main.py` |
| Backend port | 8000 |
| Config module | `app/core/settings.py` |
| Package beats module | A directory shadows a same-named `.py`. Never create `services/foo.py` beside `services/foo/`. |
| Persistence | SQLite — decided, not yet implemented. Keep `USE_DATABASE` and `db/`. |
| **UI layout** | The current page-router layout is the **accepted baseline.** The three-column workspace is deferred, not a defect. No phase re-flows the UI. |
| Frontend build | CRA 5.0.1; Vite migration planned; CI pins Node 20 LTS. |
| Market data | Free/public CoinGecko. No Pro keys. |

---

## Open product decisions

Not yet answered, and each changes what gets specified:

1. **CEX integration** — register the aggregation router and enable the working ccxt code, or
   drop the ambition? It is the cheapest large win available.
2. **On-chain** — build the Ethereum half for real (`web3` is not even a dependency), or cut
   it from the MVP and revise the acceptance test?
3. **Specific coins** — build the four missing backend routes, or remove the client calls?
4. **Tax** — a genuine cost-basis engine, or drop to "estimates" and say so plainly?

---

## Working agreements

`AGENTS.md` at the repo root governs how agents work here — Mantine 7 rules, testing rules,
seam ownership, commands. `CLAUDE.md` adds Claude-specific guidance. CI runs flake8 + pytest
and the frontend build on every push and PR to `main`, and **is green**.
