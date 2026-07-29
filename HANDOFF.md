# Handoff — Decisions & Actions Only You Can Take

**Date:** 2026-07-28
**Companion to:** `PROJECT_REVIEW.md`

This lists only the things **I cannot do for you** — either because they need
interactive auth, an outside account, or a judgment call that's yours to make.
Everything else I can execute once these are unblocked.

---

## Critical context before you move anything

The `financial-crises-history/` repo next to this one is **an empty shell**:

- 31 files, almost all Create-React-App boilerplate
- Real code: `App.tsx` (39 lines, fetches a "welcome message"), `src/server.ts` (30),
  `services/api.ts` (8) — **111 lines total**
- 2 commits, **no remote**
- Working tree has **18 uncommitted deletions** and a duplicated nested `backend/frontend/`

The real financial-crises work — **5,067 lines** — lives in **this** repo on `origin/main`:

| File | Lines |
|---|---|
| `frontend/src/components/Financial/IntegratedDashboard.jsx` | 1,887 |
| `frontend/src/components/StrategicTimeline/StrategicTimelineComponent.jsx` | 817 |
| `frontend/src/components/Financial/LeadershipCrises.jsx` | 679 |
| `frontend/src/components/Financial/LeadershipHistory.jsx` | 391 |
| `frontend/src/components/Financial/AppContext.js` | 337 |
| `frontend/src/components/Financial/CrisesTimeline.jsx` | 252 |
| `frontend/src/components/Financial/LeadershipAnalysis.jsx` | 236 |
| `frontend/src/components/Financial/DetailedCrisisTimeline.jsx` | 223 |
| `frontend/src/components/Financial/FinancialCrisesTimeline.jsx` | 175 |
| `frontend/src/pages/{FinancialCrises,LeadershipHistory,StrategicTimeline}.jsx` | 70 |

**None of it is on your machine yet.** It arrives when you pull. That means you can
decide where it should live *before* it ever lands in the crypto tracker's local tree.

---

# PART A — Decisions

### ✅ RESOLVED 2026-07-28

| # | Decision | Answer |
|---|---|---|
| 1 | New project location | **`~/Documents/financial-crises/`** — sibling of `skittles/` |
| 2 | The 5,067 lines | **Extract, then delete from tracker** — true separation |
| 3 | Old `financial-crises-history` repo | **Discard** — 111 lines of boilerplate, nothing of value |

**Action already taken on #3:** the folder was **archived, not deleted**, to
`~/Documents/financial-crises-history.archived/`. Git history is intact (2 commits, 1.4 MB).
Delete it yourself once you're satisfied nothing is needed from it.

**Open caveat on #2:** `IntegratedDashboard.jsx` (1,887 lines) may import the tracker's
`MarketContext` / `PortfolioContext`. If it does, the new project needs its own data layer.
**I'll verify this the moment the code is local** (i.e. after you pull) and flag it before
extracting. This does not change the decision — it changes how much work the extraction is.

---

### Decision 4 — Preserve git history for the extracted code? *(still open)*

| Option | Method | Trade-off |
|---|---|---|
| **A — Fresh start** *(recommended)* | Copy files, `git init`, one initial commit. | Simple, clean. Loses history of those files. |
| **B — Preserve history** | `git filter-repo --path frontend/src/components/Financial/` on a clone. | Keeps authorship. Needs `git-filter-repo`; more steps; easy to get wrong. |

The entire Financial history is essentially **one commit** (`3f7e2d28`), so B buys very little.
*Low stakes — I'll default to A unless you say otherwise.*

---

### Decision 5 — Purge the 80 MB Node installer from git history?

`backend/app/services/ai/node-v22.14.0.pkg` — 80 MB, making `.git` 125 MB.
Remote commit `71bbbe46` already removed it from the *tree*, but it stays in *history*
forever unless purged.

- **Leave it** — 125 MB repo, slow clones, zero risk. *(fine for a solo project)*
- **Purge it** — `git filter-repo`, rewrites all SHAs, requires force-push. **Do not do
  this if anyone else has a clone.**

---

### Decision 6 — Product scope calls from `PROJECT_REVIEW.md`

I need your answer on each before I can clean up (§3.6–3.8):

- **Persistence:** SQLite or JSON flat files? (`db/models.py` is empty, `USE_DATABASE` defaults False)
- **Entry point:** `app/main.py` or `app/simple_server.py`? (both exist)
- **Config:** `app/config.py` or `app/core/settings.py`? (both live, 4 importers each)
- **Orphaned modals:** wire `AddTransactionModal`/`EditAssetModal` into `Portfolio.js`, or delete?

---

# PART B — Actions I cannot perform

### ✅ Action 1 — Authenticate GitHub — **DONE 2026-07-28**

```
✓ Logged in to github.com account mogascan (keyring)
  Protocol: https   Scopes: gist, read:org, repo, workflow
```

**Still worth running:** `gh auth setup-git` — registers `gh` as git's credential helper so
git and `gh` share one token instead of drifting apart. Their drifting apart is what caused
the original "invalid token" failure.

**Protocol decision:** stay on **HTTPS**. Tested `ssh -T git@github.com` →
`Permission denied (publickey)`. The local `id_rsa` (RSA-3072, 2023) is not registered with
GitHub and no identity is loaded in ssh-agent. HTTPS is already fully wired; SSH would mean
generating an ed25519 key, uploading it, and rewriting every remote.

---

### ✅ Action 2 — Create the new GitHub repo — **DONE 2026-07-28**

**<https://github.com/mogascan/financial-crises>** — private, default branch `main`,
HTTPS remote, initial commit pushed.

Local: `~/Documents/financial-crises/` — README documenting provenance and the extraction
checklist, plus a `.gitignore` that excludes `*.pkg` (so this repo can't repeat the 80 MB
installer mistake).

Contains scaffold only. The ~5,067 lines still need extracting — see Part C.

---

### Action 3 — Rotate the OpenAI key

The live service-account key in `backend/.env` was never committed (correctly gitignored),
but a failing test prints it to stdout, so it will land in any CI log.

1. Revoke at <https://platform.openai.com/api-keys>
2. Issue a new one
3. Update `backend/.env`

Only you can do this — it's your OpenAI account.

---

### Action 4 — Restart Claude Code / your IDE

Plugin slash-commands (`/codex:*`, `/opsx:*`) and memsearch's session hooks don't load
until a fresh session.

---

### Action 5 — Reddit API credentials (optional, deferred)

`/api/v1/news/reddit/*` returns **403** — unauthenticated. `praw` is already installed.
Needs an app registered at <https://reddit.com/prefs/apps> (your account), then
`REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` in `.env`.

---

# PART C — Recommended order

```
1. [YOU]  gh auth login                          → Action 1
2. [YOU]  Answer Decisions 1–4
3. [ME]   Commit current fixes to a branch       ← must happen before any merge
4. [YOU]  git fetch origin
5. [ME]   Merge origin/main onto the branch, resolve conflicts
6. [ME]   Check IntegratedDashboard.jsx's imports → informs Decision 2's real cost
7. [YOU]  Confirm Decision 2 now that the cost is known
8. [ME]   Extract Financial/ + StrategicTimeline/ + 3 pages to the new project
9. [YOU]  Create the GitHub repo                 → Action 2
10.[ME]   Push, wire up the new project, verify it builds
11.[YOU]  Rotate the OpenAI key                  → Action 3
12.[ME]   Phase 1 stabilization from PROJECT_REVIEW.md §5
```

**Step 3 is not optional.** Your local tree has real uncommitted work — the `Dashboard.js`
edit and 6 untracked files. The incoming commits touch `Watchlist.js` and `Settings.js`.
Merging onto a dirty tree is how the `DashboardSummary.js` corruption likely happened in
the first place.

---

# What I can start on right now, unblocked

None of these need auth or your decisions:

- **`backend/pytest.ini`** with `pythonpath = .` and `asyncio_mode = auto` — fixes the
  run-from-root failure and 3 async errors
- **Fix `test_openai_service_initialization`** to inject a fake key — stops the real key
  leaking into test output *(do this before Action 3 and you'll only rotate once)*
- **The two intent-classification bugs** — the AI assistant's routing is your headline
  feature and it's measurably broken
- **Port unification** on 8000 in root `package.json`
- **Delete dead code** — ~1,477 lines of shadowed modules, 2 `.bak` files,
  `tempCodeRunnerFile.py`, empty `core/config.py` *(needs Decision 6 for the config/entry-point calls, but the shadowed modules and `.bak` files are unambiguous)*

Say the word and I'll take the unblocked items while you work through Part B.
