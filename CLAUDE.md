@AGENTS.md

---

# Claude Code specifics

Everything in `AGENTS.md` applies. This file adds only what is Claude-specific.

## Before claiming something works

`AGENTS.md` defines a three-part [definition of done](AGENTS.md#definition-of-done--blocking-gate).
Apply it to your own output too: run the thing, show the result, and if you did not verify a
claim, say which one. This repository has repeatedly produced code that looked complete and was
switched off — a plausible-sounding summary is the failure mode to avoid, not the goal.

Report faithfully. If tests fail, paste the output. If you skipped part of the scope, name it.

## Verify before you delete

Deletion decisions here have gone wrong in both directions — dead code kept because it looked
load-bearing, and live code deleted because it looked dead. Before removing anything:

```bash
# Is it imported or registered anywhere?
grep -rn "<name>" backend/app frontend/src --include="*.py" --include="*.js" | grep -v venv

# Is a same-named package shadowing it?
ls -d backend/app/services/<name>/ backend/app/services/<name>.py 2>/dev/null
```

Watch for false positives — a `\bUser\b` search matches `"User-Agent"` headers and
`description="User ID"` field text, not just the ORM class.

Unused code that represents **unfinished features** is not dead code. `Settings.js`'s orphaned
handlers and the half-built risk UI in `DashboardSummary` are lint warnings on purpose. Wire
them up or leave them; do not delete them to satisfy a linter.

## Scope discipline

Do the task asked. When you find something else broken — and you will — report it rather than
silently expanding the change. Several bugs in this repo were found exactly that way
(`api/portfolio.js` was invalid JavaScript; `extract_keywords` was defined twice), and each was
worth surfacing separately rather than burying in an unrelated commit.

If a decision is genuinely the user's — persistence, product scope, anything destructive or
outward-facing — ask once, with the evidence, and a recommendation.

## The plan of record

`~/.claude/plans/is-sdd-installed-is-wobbly-mitten.md` is the current plan. Where it and an
in-session answer disagree, **the plan wins** unless the user says otherwise — that has already
caused one reversal on persistence.

## Commit messages

Explain *why*, and record what was verified. State what you deliberately did not do and the
reason. Prose over bullet fragments. Do not overstate: "verified 19 passed" beats "all tests
pass".
