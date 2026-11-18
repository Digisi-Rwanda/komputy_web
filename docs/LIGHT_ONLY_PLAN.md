# Komputy light only plan

Goal: Komputy has one theme, a soft light theme, everywhere (marketing site, sign in, the app, the staff console,
emails, share card, icons). No dark mode, no theme switch anywhere, no code path that could turn it back on.
Light does not mean glaring white: the page is a soft grey, panels are a step lighter, text is near black, and
greys carry the hierarchy.

## 1. What exists today (scan of 18 Nov 2026)

| Area               | Today                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme tokens       | `src/app/globals.css`: dark palette on `:root` (default), light palette in `[data-theme="light"]`                                                                                                                   |
| Pre paint script   | `src/app/layout.tsx` `themeScript` reads `localStorage.theme` and `prefers-color-scheme`, sets `data-theme`                                                                                                         |
| Switches           | `organisms/ThemeToggle.tsx` (sun/moon button + `toggleTheme`), "Toggle theme" in `UserMenu` and in `CommandPalette`, theme choice (Light, Dark, System) in `account/Appearance.tsx`, helpers in `lib/appearance.ts` |
| Dev pages          | `app/dev/ui` and `app/dev/tokens` render `ThemeToggle`                                                                                                                                                              |
| Emails             | `server/email/message.ts` renders a dark email (black page, white text); `account/Emails.tsx` previews it                                                                                                           |
| Share card, icons  | `app/opengraph-image.tsx`, `twitter-image.tsx`, `app/icon.svg` and the PNG icons: near black `#0b0b0b`                                                                                                              |
| App manifest       | `app/manifest.ts`: `background_color` and `theme_color` `#0b0b0b`                                                                                                                                                   |
| Hero art           | `public/textures/hero-gradient-a.webp`, `-b.webp` (glow tuned for black), `grain.png`                                                                                                                               |
| Hard coded colours | about 20 hex or white/black utilities in components: Emails preview, WorkspaceSwitcher, Button, Checkbox, Switch, Slider, Stepper, FilterBar, NotificationBell, SecurityPanel, ProductWindow, ecl Shell             |
| Elevation          | the dark design separates panels with inner light rings, not shadows; on light that reads flat                                                                                                                      |

## 2. The light palette (single source in `:root`)

Soft, low glare: no pure white page, near black (not black) text, greys for structure. Signals keep their hue,
darkened where needed so text on tints passes WCAG AA (4.5:1).

| Token                                                | Value                                                                                                             | Role                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--canvas`                                           | `#f3f4f6`                                                                                                         | page background (soft grey, not white)                            |
| `--canvas-deep`                                      | `#eceef1`                                                                                                         | marketing bands, hero base                                        |
| `--raised`                                           | `#fbfbfc`                                                                                                         | cards, panels, menus, dialogs (a step lighter than the page)      |
| `--sidebar`                                          | `#eef0f3`                                                                                                         | sidebar and mobile drawer                                         |
| `--surface` / `--surface-hover` / `--surface-active` | `#e8eaee` / `#e1e4e9` / `#d8dce3`                                                                                 | inputs, table headers, hover, pressed                             |
| `--fg` / `--fg-body` / `--fg-muted` / `--fg-subtle`  | `#15171c` / `#2b2f37` / `#5d636e` / `#6e7480`                                                                     | headings, body, secondary, tertiary (all AA on canvas and raised) |
| `--line` / `--line-strong` / `--hairline`            | `#dfe2e7` / `#c9ced6` / `#e7e9ed`                                                                                 | borders and dividers                                              |
| `--primary` / `--primary-fg` / `--primary-hover`     | `#15171c` / `#fbfbfc` / `#2b2f37`                                                                                 | main buttons (ink on soft background)                             |
| `--secondary` / `--secondary-hover`                  | `#e5e8ec` / `#dadee4`                                                                                             | secondary buttons                                                 |
| `--accent` / `--link` / `--focus`                    | `#0062d6` / `#0059c2` / `#0072f5`                                                                                 | brand blue, links, focus ring                                     |
| `--positive` / `--warning` / `--negative` / `--info` | `#007a4d` / `#7a5d00` / `#c4002b` / `#0059c2`                                                                     | signal text and dots                                              |
| tints                                                | `#d9f5e8` / `#f8eecb` / `#f9dde3` / `#dde9f8` / `#eceef1`                                                         | positive, warning, negative, info, neutral pills                  |
| `--scrim`                                            | `rgb(21 23 28 / 0.45)`                                                                                            | dims the page behind dialogs (no blur)                            |
| shadows                                              | `--shadow-panel: 0 1px 2px rgb(21 23 28 / .06), 0 4px 16px rgb(21 23 28 / .06)` and a stronger `--shadow-overlay` | elevation on light replaces the dark inner rings                  |

Charts: the series colours are re-checked on the light canvas (3:1 against the background) and the grid,
crosshair and tooltip move to the light greys.

## 3. Work plan (in order; each step ends with its check)

**L1. Tokens.** Put the light palette in `:root` and delete the dark palette, the `[data-theme="light"]` block and
the unused dark raw greys; `color-scheme: light`; add the two shadow tokens and use them in `.ring-inner` panels,
popovers, dialogs, toasts and the command palette. _Check:_ build; every token used in components still exists.

**L2. Remove every switch.**

- Delete `organisms/ThemeToggle.tsx` (button and `toggleTheme`).
- Remove "Toggle theme" from `UserMenu` and from `CommandPalette`.
- Remove the theme section from Account, Appearance (density and reduce motion stay).
- Delete the theme functions and type from `lib/appearance.ts`.
- Drop the theme part of `themeScript` in `layout.tsx` (density and motion stay) and remove it from the dev pages.
- Old `localStorage.theme` values are simply ignored (nothing reads them).

_Check:_ `grep` finds no `data-theme`, `toggleTheme`, `prefers-color-scheme`, `ThemeToggle` or `"theme"` key in `src`.

**L3. Hard coded colours.** Replace each hex and white/black utility in the components listed above with tokens
(for example the primary button's text uses `--primary-fg`, the workspace avatar uses the accent). _Check:_ no
hex colours in components except brand art.

**L4. Hero and marketing art.** Replace the dark tuned `hero-gradient-a/b.webp` with a light CSS gradient (soft
blue and violet wash on the canvas); tune `grain` and the blueprint grid opacity for light; re-check the product
window mock, pricing glow and CTA band. _Check:_ screenshots of `/`, `/pricing`, `/services/ecl`, `/security`.

**L5. Emails.** Light email template in `server/email/message.ts` (soft grey page, white card, near black text,
brand blue button) and the matching preview in `account/Emails.tsx`. _Check:_ render a welcome and a reset email
and view them; they read well in Gmail light and dark.

**L6. Share card, icons, manifest.** Light share card (`opengraph-image`, `twitter-image`); icon redrawn as the
ink mark on a light tile; `apple-icon`, `favicon.ico` and the 192/512 icons regenerated
(`scripts/build-icons.mjs`); manifest `background_color` and `theme_color` light. _Check:_ view the PNGs.

**L7. Contrast pass.** A small script computes WCAG contrast for every text token on canvas, raised and surface,
and every signal on its tint; anything under 4.5:1 (3:1 for large text and UI borders) is fixed. _Check:_ the
script prints all pairs passing.

**L8. Guard.** CI step fails on `data-theme`, `prefers-color-scheme`, `toggleTheme` or `color-scheme: dark` in
`src`, so dark mode cannot come back by accident.

**L9. Visual review and tests.** Screenshots at phone, tablet and desktop of: landing (with the Services menu
open), pricing, security, sign in, sign up, home, ECL runs, run detail, results, leases register, lease detail,
admin members, account appearance, platform overview, a dialog, a toast, the command palette, the mobile drawer.
Full check (types, lint, unit tests, build), the three e2e suites, the text guard. Then commit and push both
nothing else.

## 4. What stays

- Density (comfortable or compact) and reduce motion in Account, Appearance.
- Layout, spacing, components and behaviour: only colours, shadows and the removed switches change.
- Status colours keep their meaning (green positive, amber warning, red negative, blue info).
