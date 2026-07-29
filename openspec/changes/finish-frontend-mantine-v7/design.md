# Design — finish the Mantine 7 migration

## Why the v6 code is invisible rather than broken

Mantine 7 removed the v6 API. It did not deprecate it. React passes unknown props through and
Mantine ignores the ones it no longer recognises, so `<Group position="apart">` renders — just
without the alignment. Nothing warns. That is why ~285 call sites survived unnoticed and why
grep, not the browser, is the tool that finds them.

`theme.colorScheme` is the damaging one: it is `undefined` in v7, so
`theme.colorScheme === 'dark'` is always `false` and every dark branch silently takes the
light path.

## Three tiers of work, in increasing risk

**Tier 1 — mechanical renames (~239 sites).** `spacing=` → `gap=`, `position=` → `justify=`,
`Text weight=` → `fw=`, `align=` → `ta=`. Scriptable, individually verifiable by grep, zero
semantic ambiguity. Do these first and in one commit per prop so a regression is bisectable.

Care required: `position=` is only wrong on Mantine layout components. `position` is also a
legitimate CSS property inside `style={{}}`, and Recharts components take their own `position`
props. Match on the component, not the string.

**Tier 2 — the two `sx` blocks with `&:hover`.** `ChatHistoryPanel` and `Watchlist`. Inline
`style` cannot express a pseudo-class, so these need a CSS module. Small and self-contained.

**Tier 3 — `App.js`'s `createTheme` overrides (18 sites).** The genuinely hard one, and the
reason this change carries visual risk.

## Tier 3 in detail

`App.js` builds a theme at module scope whose component `styles` callbacks do two things that
no longer work:

1. Read `theme.colorScheme`, which does not exist in v7
2. Use nested selectors — `'& thead tr th'`, `'& tbody tr td'` — which stopped working when
   Mantine 7 dropped emotion

It is also passed `theme={{ ...theme, colorScheme }}`, a v6 pattern. In v7 the colour scheme
lives on `MantineProvider` and is read with `useMantineColorScheme()`.

This block themes `Paper`, `Card`, `Table` and `AppShell` — that is, most surfaces in the app.
Getting it wrong is visible everywhere, which is why it is sequenced last and verified by eye.

**Approach:** replace conditional values with the CSS `light-dark()` function rather than
threading a hook through a module-scope theme. `light-dark(a, b)` resolves against the colour
scheme Mantine already sets on the root element, so it works inside a plain style object with
no React state:

```js
backgroundColor: `light-dark(${theme.white}, ${theme.colors.dark[7]})`
```

Nested selectors move to a CSS module. There is no postcss config in this project, so
`light-dark()` is used as native CSS — supported in current Chrome, Safari and Firefox.
**Verify it renders before converting all 18 sites**; if it does not, fall back to a CSS module
keyed on Mantine's `[data-mantine-color-scheme="dark"]` root attribute, which has no such
requirement.

## Colour-scheme source of truth

There are currently two: `useConfig()` supplies a `theme` value that `App.js` feeds into
`MantineProvider`, while components call `useMantineColorScheme()`. They can disagree.

Converge on `useMantineColorScheme()` as the single source, with `ConfigContext` — if it
persists the preference — writing through to `setColorScheme` rather than holding a parallel
copy. Do not leave both authoritative.

## Verification

The weak point of this change is that there is no component test suite, so the definition of
done's third condition — a test that fails if the capability is removed — cannot be met the
usual way.

What replaces it:

- `CI=true npm run build` exits 0
- Zero occurrences of `theme.colorScheme`, `sx={`, `spacing=`, `position=` on Mantine
  components, and `Text weight/align` — a grep assertion, which *is* a test that fails if the
  work is reverted
- **Visual confirmation in both light and dark mode**, on Dashboard, Portfolio, Markets, News
  and the AI chat panel

The visual check is the real acceptance criterion. It cannot be delegated to CI, and "the build
passes" must not be reported as "dark mode works".

## Ordering against the backend

`useExtendedSearch.js` calls `/api/symbols`, `/api/symbols/refresh`, `/api/symbols/alert-setup`
and `/api/token/`. **None exist server-side yet.** They are being built in
`complete-portfolio-aggregation`. Wiring the client before those land would ship a component
that 404s — the same mistake that produced the current breakage. Do the theming work first;
take the client last, after the backend routes are merged.
