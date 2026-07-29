# AGENTS.md

Operating rules for any agent working in this repository — Claude Code, Codex, or otherwise.
Supersedes `rules.md` and `.cursor.json`, both of which are retired. Read the note on why
in [Retired guidance](#retired-guidance) before reinstating anything from them.

---

## Settled decisions

These are closed. Do not re-litigate them in a change proposal; if one needs revisiting, say
so explicitly and get a decision first.

| Decision | Value | Why |
|---|---|---|
| Backend entry point | `backend/app/main.py` | Registers all five routers. `simple_server.py` registered zero and was deleted. |
| Backend port | **8000** | The frontend hardcodes `localhost:8000` in 11 places. |
| Config module | `app/core/settings.py` | `app/config.py` subclassed `BaseModel`, not `BaseSettings`, so its `env_file` was inert and no environment variable was ever read. Deleted. |
| Package beats module | packages win | A directory shadows a same-named `.py` in Python. Four service modules (~1,477 lines) were unreachable because of this. Never create `services/foo.py` beside `services/foo/`. |
| Persistence | **SQLite** — decided, *not yet implemented* | JSON flat files under `backend/data/` are the legacy path being migrated away from. Keep `USE_DATABASE` and the `db/` layer. Do not delete `db/models.py`. Implementation gets its own spec. |
| UI layout | current page-router layout is the **baseline** | The planning documents describe a three-column workspace. That difference is deferred, not a defect. Nothing in current phases re-flows the UI. |
| Frontend build | Create React App (`react-scripts` 5.0.1) | Unmaintained; a Vite migration is planned. Until then CI pins Node 20 LTS. |

---

## Definition of done — blocking gate

A capability may **not** be described as done unless all three hold:

1. It is **reachable** — a registered route, an imported module, or a rendered component.
2. Its default path returns **real data**, with no mock fallback. Mocks live behind an
   explicit flag only.
3. At least **one test fails if it is removed.**

This is not advice. It is the rule that would have caught `api/routes/portfolio.py`,
`simple_server.py`, the shadowed service modules, and the specific-coins work — every one of
which was written, looked finished, and was switched off.

When you find code that fails this gate, say so plainly rather than counting it as shipped.

---

## Repository structure

```
backend/app/api/v1/     API routes — versioned, never route logic in main.py
backend/app/services/   Service layer (packages, not modules — see above)
backend/app/models/     Pydantic API models and SQLAlchemy entities
backend/app/db/         Database layer — keep, pending the SQLite spec
backend/app/core/       settings.py, logging
backend/data/           Cached JSON, live data stores
backend/tests/          ALL tests live here. No exceptions.
backend/scripts/        Shell scripts
frontend/src/pages/     Page components
frontend/src/components/
frontend/src/contexts/  React contexts (PortfolioContext is localStorage-backed)
```

Do not create duplicate files — check the path exists first. Do not add a `webhooks/`
directory unless something needs it; the old rules file documented one that never existed.

---

## Frontend: Mantine 7, not Mantine 6

The project runs **Mantine 7.17**. It is mid-migration, and the v6 API is not deprecated in
v7 — it is **removed**, silently. Wrong props are ignored rather than erroring, so v6 code
looks fine and does nothing.

**Never write these:**

| v6 (removed) | v7 | Effect if used |
|---|---|---|
| `theme.colorScheme` | `useMantineColorScheme()` | `undefined === 'dark'` → every dark branch falls through to light |
| `sx={}` | `style={{}}`, `styles={{}}`, or CSS module | ignored entirely |
| `createStyles()` | CSS modules | removed with emotion |
| `<Group position=>` | `justify=` | ignored |
| `<Group spacing=>` / `<Stack spacing=>` | `gap=` | ignored |
| `<Text weight=>` / `<Text align=>` | `fw=` / `ta=` | ignored |
| `<NumberInput precision=>` | `decimalScale=` | decimal limit not applied |

Nested selectors (`'&:hover'`, `'& thead tr th'`) do **not** work in `style` or `styles`
objects — Mantine 7 dropped emotion. Use a CSS module.

**Known outstanding debt** (roughly 285 sites): `spacing=` 98, `position=` 90,
`Text weight/align` 51, `sx=` 22, `theme.colorScheme` 21. The remaining `colorScheme` sites
are in `App.js`'s `createTheme` overrides and two `sx` blocks, and need a real migration
rather than a rename.

Stylesheet order matters: `App.js` imports `@mantine/core/styles.css`, so `index.css` must be
imported **after** `App` in `index.js` or Mantine wins every tie.

---

## Data and API behaviour

- Market data uses the **free/public CoinGecko API** (`https://api.coingecko.com/api/v3`).
  No Pro keys.
- News feeds (crypto, macro, Reddit) use live endpoints.
- **No Twitter/X feed** — dropped from scope 2026-07-28. `services/news/twitter_service.py`
  and `GET /api/v1/news/twitter/user/{handle}` still exist and are reachable, but must not be
  built on, configured, or treated as unfinished work to complete. Reddit is the social source.
- API errors return **clear user-facing messages**, not silent fallbacks to mock data.
- Mock data is for explicit testing only, must be recorded in
  `backend/tests/mock_data_log.md` with an expiry, and deleted when done.

---

## Testing

- **All test files live in `backend/tests/`.** Naming: `test_*.py`.
- A helper that takes arguments must not be named `test_*` — pytest will collect it and fail
  with a fixture error. Three functions had to be renamed to `check_*` / `run_*` for this.
- Resolve fixture paths relative to `__file__`, not the working directory, so the suite runs
  from either `backend/` or the repo root.
- **The suite must pass with no secrets.** CI runs without `OPENAI_API_KEY`. Never assert
  against a live key, and never let one reach stdout.
- Assert; do not just print.

---

## Commands

```bash
# Backend — always python3, port 8000
cd backend && python3 -m uvicorn app.main:app --reload --port 8000
cd backend && pytest -q
cd backend && flake8 app tests

# Frontend — the script is `start`, not `dev`
cd frontend && npm start
cd frontend && npm run build      # DISABLE_ESLINT_PLUGIN is set; warnings do not fail it
cd frontend && npm run lint       # 96 warnings, 0 errors — visible, not yet blocking
```

CI (`.github/workflows/ci.yml`) runs flake8 + pytest and the frontend build on every push and
PR to `main`. **It is green. Keep it green** — a gate that starts red is a gate everyone
learns to ignore.

`backend/.flake8` is deliberately narrow: formatter-owned codes are excluded so that the
pyflakes checks which find real defects stay meaningful. `F401` (181 unused imports) is
tracked backlog, not a licence to add more.

---

## Seam ownership

When two agents work in parallel, ownership is by directory to keep changes isolated:

| Agent | Owns | Seams |
|---|---|---|
| Claude Code | `backend/` | specific-coins route, dead code, config, entry point, aggregation, SQLite |
| Codex | `frontend/` | orphaned modals, specific-coins client, Mantine v7 + Vite |

`openspec/changes/<name>/` is per-change so proposals don't collide. The contention point is
**archive time** — `openspec archive` syncs delta specs into shared `openspec/specs/`, so
archive one change at a time. Branch per agent off a merged `main`.

---

## Retired guidance

`rules.md` has been **deleted** — recoverable from git history, but it must not be reinstated.
`.cursor.json` has been rewritten to point here instead. What was wrong with them:

- `rules.md` instructed agents to "support dark mode styling using `theme.colorScheme`" and to
  "use Mantine's `sx` prop or `createStyles()`". All three were removed in Mantine 7. That
  instruction is the most likely origin of the 52-site dark-mode bug — agents followed the
  rules file and produced code that silently does nothing.
- It also documented a `backend/app/webhooks/` directory that does not exist, and
  `npm run dev`, which is not a script in this project (`npm start` is).
- `.cursor.json` lists `rules_cleaned.md` as context; that file does not exist. It also points
  at `Documents/*` paths that now live outside the repository.

Planning documents (`Ideation.docx`, `Planning.*`, `Research.*`) live in
`skittles/Documents/`, deliberately outside this repo and gitignored. Binary documents are
blocked by `.gitignore` — a deleted blob still costs every future clone, which is how this
repository reached 126 MB before the history rewrite.
