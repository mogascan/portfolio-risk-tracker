# Tasks — finish the Mantine 7 migration

**Owner:** Codex · **Seam:** `frontend/` only. Touch no file under `backend/`.

Ordered by increasing risk. Each group is a commit, and each ends with
`CI=true npm run build` exiting 0.

---

## 1. Mechanical renames — ~239 sites

One commit per prop, so a regression is bisectable.

- [ ] `spacing=` → `gap=` on `Group` / `Stack` (98)
- [ ] `position=` → `justify=` on `Group` / `Flex` (90)
- [ ] `<Text weight=>` → `fw=`, `<Text align=>` → `ta=` (51)
- [ ] `<NumberInput precision=>` → `decimalScale=` if any remain

**Do not blind-replace `position=`.** It is only wrong on Mantine layout components. CSS
`position` inside `style={{}}` is correct, and Recharts components take their own `position`
prop. Match on the component, not the string — a global search-and-replace here breaks charts.

- [ ] After each: build passes, and grep confirms the count reached zero

## 2. The two `sx` blocks with hover

- [ ] `ChatHistoryPanel.js` — `sx={(theme) => …}` containing `&:hover`
- [ ] `Watchlist.js` — `sx={theme => …}` on the risk `Box`
- [ ] Move each to a CSS module. Inline `style` cannot express a pseudo-class, so keeping the
      hover means a module
- [ ] Replace `theme.colorScheme` in both with `useMantineColorScheme()`
- [ ] Confirm hover is visible again — it does nothing today

## 3. `App.js` `createTheme` — the risky one, 18 sites

This themes `Paper`, `Card`, `Table` and `AppShell`: most surfaces in the app. Sequenced last
among the styling work for that reason.

Two separate v7 breakages in the same block:

- [ ] `theme.colorScheme` reads → `light-dark(lightValue, darkValue)` in the style objects
- [ ] Nested selectors (`'& thead tr th'`, `'& tbody tr td'`) → CSS module. They stopped
      working when Mantine 7 dropped emotion
- [ ] Replace `theme={{ ...theme, colorScheme }}` on `MantineProvider` with the v7 pattern

> **Prove `light-dark()` renders before converting all 18.** There is no postcss config here,
> so it is used as native CSS. Convert one site, look at it in both schemes, then continue. If
> it does not resolve, fall back to a CSS module keyed on Mantine's
> `[data-mantine-color-scheme="dark"]` root attribute, which has no browser caveat.

## 4. One source of truth for colour scheme

- [ ] `useMantineColorScheme()` becomes authoritative
- [ ] If `ConfigContext` persists a preference, it writes through to `setColorScheme` rather
      than holding a parallel copy
- [ ] Test: toggling updates every component without a reload

## 5. `Settings.js` orphaned handlers

- [ ] Bind `handleSelectChange` and `handleThemeChange` to their controls, or remove them
      deliberately
- [ ] These are **unfinished feature work**, not lint noise. Do not delete them merely to
      silence a warning

## 6. Specific-coins client — BLOCKED

- [ ] **Wait for confirmation that the backend routes are merged.** `useExtendedSearch.js`
      calls `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup` and
      `/api/token/`; none exist server-side yet
- [ ] Fix the hardcoded URL in `useExtendedSearch.js`
- [ ] Wire the hook into its consumer
- [ ] Verify against the real endpoints, not mocks

## 7. Vite migration

Take last. It changes the build for everything above.

- [ ] Replace `react-scripts` 5.0.1 with Vite
- [ ] Port `DISABLE_ESLINT_PLUGIN` behaviour — the build must not fail on the 96 known warnings
- [ ] Update `.github/workflows/ci.yml`; the Node 20 LTS pin exists only to work around CRA
      and can likely be relaxed
- [ ] Verify the production build renders correctly in both colour schemes

---

## Definition of done

There is no component test suite, so the usual third condition cannot be met directly. It is
replaced by:

- [ ] `CI=true npm run build` exits 0
- [ ] Grep asserts **zero** occurrences of `theme.colorScheme`, `sx={`, Mantine `spacing=`,
      Mantine `position=`, and `Text weight/align`. This is the check that fails if the work
      is reverted
- [ ] **Visual confirmation in both light and dark mode** across Dashboard, Portfolio,
      Markets, News and the AI chat panel

The visual check is the actual acceptance criterion. A passing build does not mean dark mode
works — the whole reason this bug survived is that broken theming builds cleanly. Do not
report "build passes" as "dark mode works".

---

## Standing constraints

- Mantine 7. The v6 API is **removed**, not deprecated — wrong props are silently ignored
- No Twitter feed component. Dropped from scope; `MockData.js` references one that does not
  exist and must not be created
- The current page-router layout is the accepted baseline. **Nothing here re-flows the UI** —
  this is a correctness change; components render where they render today
- If something else looks broken, report it; do not widen this change
