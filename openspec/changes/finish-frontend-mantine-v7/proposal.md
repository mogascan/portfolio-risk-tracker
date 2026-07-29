# Finish the Mantine 7 migration and the unwired frontend clients

**Seam:** `frontend/` — Codex
**Status:** proposed

## Why

The project runs Mantine 7.17 but was written against Mantine 6. In v7 the old API is not
deprecated — it is **removed**, and silently. Wrong props are ignored rather than erroring, so
v6 code compiles, renders, and does nothing.

The user-visible consequence is that **dark mode does not work**. Every
`theme.colorScheme === 'dark'` comparison evaluates `undefined === 'dark'` → `false`, so each
dark branch falls through to light styling.

The likely cause is documented: the retired `rules.md` instructed agents to "support dark mode
styling using `theme.colorScheme`" and to "use Mantine's `sx` prop or `createStyles()`". Agents
followed it faithfully and produced dead styling. That file is now deleted and `AGENTS.md`
carries the correct table, so the same bug should not be reintroduced.

## Scope

Roughly 285 v6 call sites remain:

| Pattern | Sites | v7 replacement | Effect today |
|---|---|---|---|
| `spacing=` on Group/Stack | 98 | `gap=` | ignored |
| `position=` on Group/Flex | 90 | `justify=` | ignored |
| `<Text weight=/align=>` | 51 | `fw=` / `ta=` | ignored |
| `sx={}` | 22 | `style`, `styles`, or CSS module | ignored entirely |
| `theme.colorScheme` | 21 | `useMantineColorScheme()` | **dark mode broken** |

37 of the original 52 `colorScheme` sites are already fixed, along with the inverted stylesheet
import order and the removal of unused MUI/emotion packages.

## The two hard parts

Most of the above is a mechanical rename. Two areas are not:

1. **`App.js`'s `createTheme` overrides** — 18 sites. The `styles` callbacks use nested
   selectors (`'& thead tr th'`) which stopped working when Mantine 7 dropped emotion, *and*
   read `theme.colorScheme` which no longer exists. This needs a real migration to CSS modules
   or `light-dark()`, not a substitution. It is the app-wide Paper/Card/Table/AppShell theming,
   so it carries the most visual risk.
2. **Two `sx` blocks** (`ChatHistoryPanel`, `Watchlist`) containing `&:hover` rules that inline
   `style` cannot express.

## Also in scope

- **Specific-coins client** — `hooks/useExtendedSearch.js` is unimported and has a hardcoded
  URL. It calls `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup` and
  `/api/token/`, **none of which exist server-side**. Coordinate with the backend change; do
  not ship a client against absent routes.
- **`Settings.js` orphaned handlers** — `handleSelectChange` and `handleThemeChange` are
  defined and never bound to a control.
- **Vite migration** — `react-scripts` 5.0.1 is unmaintained and the source of most Dependabot
  advisories. CI currently pins Node 20 LTS to work around it.

## Non-goals

The current page-router layout is the accepted baseline. The planning documents' three-column
workspace is deferred. **Nothing here re-flows the UI** — this is a correctness change that
restores dark mode; components render exactly where they render today.

**No Twitter/X feed.** Dropped from scope 2026-07-28. Do not build a Twitter feed component.
`components/News/MockData.js` contains mock data described as "for the Twitter feed component"
— that component does not exist and must not be created. Reddit stays the social source.

## The rule this change is held to

Same gate as everything else: reachable, real data on the default path, and at least one test
that fails if the capability is removed. For the styling work the third condition is weakest —
there is no component test suite — so verification is: `CI=true npm run build` exits 0, no
`theme.colorScheme` / `sx=` remain, and dark mode is confirmed **visually** in both schemes.
The visual check is the acceptance criterion that matters and cannot be delegated to CI.

## Coordination

Per `AGENTS.md` seam ownership, this change owns `frontend/` exclusively and touches no backend
file. The contention point is archive time — `openspec archive` syncs delta specs into the
shared `openspec/specs/`, so archive one change at a time.
