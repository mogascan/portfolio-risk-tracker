# Spec — frontend theming on Mantine 7

## ADDED Requirements

### Requirement: Dark mode applies everywhere

The system SHALL render dark styling on every surface when the dark colour scheme is active.

Today it does not. `theme.colorScheme` was removed in Mantine 7, so every
`theme.colorScheme === 'dark'` comparison evaluates `undefined === 'dark'` → `false` and each
dark branch falls through to light.

#### Scenario: Dark scheme is honoured
- **WHEN** the colour scheme is dark
- **THEN** Dashboard, Portfolio, Markets, News and the AI chat panel all render dark surfaces
- **AND** this is confirmed visually, not inferred from a successful build

#### Scenario: Light scheme is unaffected
- **WHEN** the colour scheme is light
- **THEN** rendering is unchanged from before this work

---

### Requirement: No Mantine 6 API remains

The system SHALL contain no removed-in-v7 API. Wrong props are silently ignored rather than
raising, so their absence must be asserted rather than assumed.

| Removed | Replacement |
|---|---|
| `theme.colorScheme` | `useMantineColorScheme()` |
| `sx={}` | `style`, `styles`, or a CSS module |
| `createStyles()` | CSS module |
| `position=` on Group/Flex | `justify=` |
| `spacing=` on Group/Stack | `gap=` |
| `<Text weight= / align=>` | `fw=` / `ta=` |
| `<NumberInput precision=>` | `decimalScale=` |

#### Scenario: Grep asserts the migration
- **WHEN** the codebase is searched for the removed API
- **THEN** there are no matches in `frontend/src`
- **AND** this check is what fails if the work is reverted, standing in for a unit test

#### Scenario: False positives are not swept up
- **WHEN** `position=` is replaced
- **THEN** CSS `position` inside `style={{}}` is left alone
- **AND** Recharts components keeping their own `position` prop are left alone

---

### Requirement: One source of truth for colour scheme

The system SHALL read the active colour scheme from `useMantineColorScheme()`, and SHALL NOT
maintain a second independent copy.

`ConfigContext` currently supplies a theme value that `App.js` passes into `MantineProvider`
while components read the hook. Two sources can disagree.

#### Scenario: Preference propagates
- **WHEN** the user changes the colour scheme
- **THEN** every component reflects it without a reload
- **AND** any persisted preference writes through to Mantine rather than being held separately

---

### Requirement: Nested selectors use a CSS module

The system SHALL express hover states and descendant selectors in CSS modules.

Mantine 7 dropped emotion. Nested selectors in `style` or `styles` objects — `'&:hover'`,
`'& thead tr th'` — do nothing.

#### Scenario: Hover works
- **WHEN** a component previously declared `&:hover` inside `sx`
- **THEN** the hover state is visible after migration

---

### Requirement: Client is not shipped against absent routes

The system SHALL NOT wire the specific-coins client until the backend routes exist.

`useExtendedSearch.js` calls `/api/symbols`, `/api/symbols/refresh`,
`/api/symbols/alert-setup` and `/api/token/`, none of which the server implements. Shipping a
client against absent routes is how the current breakage arose.

#### Scenario: Ordering is respected
- **WHEN** the specific-coins client is wired in
- **THEN** the four backend routes are already merged and reachable

---

### Requirement: No Twitter feed component

The system SHALL NOT contain a Twitter/X feed component.

Dropped from scope 2026-07-28. `components/News/MockData.js` contains data described as "for
the Twitter feed component" — that component does not exist and must not be created.

#### Scenario: Twitter stays absent
- **WHEN** the news UI is built or extended
- **THEN** no Twitter feed component is added, and Reddit remains the social source
