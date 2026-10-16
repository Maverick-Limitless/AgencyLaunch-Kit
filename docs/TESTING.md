# Testing guide

Four suites cover the product: unit tests for the calculator, static checks of the shipped files, contrast checks of the palette, and an optional browser suite. Commands below assume you are in the project root (`agencylaunch-kit/`).

## Prerequisites

| Suite | Needs |
| --- | --- |
| `tests/calculator.test.js` | Node.js 18+ (uses the built-in `node:test` runner) |
| `tests/smoke-checks.js` | Node.js 18+ |
| `tests/contrast-checks.js` | Node.js 18+ |
| `tests/browser-checks.js` | Node.js 18+ **and** Playwright (not a product dependency — see below) |

Node's built-in test runner is used, so there is nothing to install for the first three suites.

## Unit tests — calculator logic

```bash
node --test tests/calculator.test.js
```

Expected output: `tests 20`, `suites 0`, `pass 20`, `fail 0`. The suite covers the twenty cases required by the product specification:

1. the default reference calculation (57.7778 h / 28.8889 h / $722.22 / $622.22 / 0.8036 months)
2. zero tasks per week
3. zero minutes per task
4. zero automation rate
5. zero hourly labor cost
6. zero monthly tools cost
7. zero setup cost (payback of 0, no division error)
8. maximum allowed values on every field
9. minimum allowed values on every field
10. invalid numeric input (empty, non-numeric)
11. negative values on every field
12. values above the maximum on every field
13. non-finite values (`Infinity`)
14. net monthly estimate exactly zero
15. net monthly estimate below zero
16. reset semantics — defaults revalidate after arbitrary changes
17. recalculation after changing each of the six inputs
18. consistent rounding and formatting
19. no `NaN`/`Infinity` in formatted output across an input matrix
20. the calculator source contains no network/storage transmission

The tests import the pure functions from `script.js` (`validateCalculatorInput`, `calculateRoi`, the formatters) and compute their expected values from the specification formulas independently, so a formula regression fails a test rather than agreeing with the implementation.

## Static checks

```bash
node --test tests/smoke-checks.js
```

Checks, against the real files on disk:

- required files exist and are non-trivial
- local asset/stylesheet references resolve to real files
- every internal anchor (`#…`) points at an `id` that exists
- no duplicate `id` attributes
- all six calculator inputs have associated `<label for>` elements
- each input references its hint and error slot via `aria-describedby`
- heading hierarchy: exactly one `h1`, no skipped levels
- document metadata: `lang`, charset, viewport, title, description, skip link
- inline SVGs are labelled or `aria-hidden`
- the FAQ uses native `<details>`/`<summary>` (at least five)
- every JavaScript file passes `node --check`
- CSS braces balance; the required design tokens exist
- no `TODO`/`FIXME`/lorem-ipsum in release-critical files
- no secrets or credentials (key/private-key/token patterns) anywhere in the product files
- no external scripts, trackers, or hotlinked resources; exactly one `<script>` and one stylesheet `<link>`, both local
- the contact placeholder is the documented `hello@example.com` with its replacement note

## Contrast checks

```bash
node --test tests/contrast-checks.js
```

Reads the palette tokens directly out of `styles.css`, computes WCAG 2.x relative-luminance contrast ratios, and asserts:

- every text pair meets 4.5:1 (body ink, muted text, button label on accent, hero/footer text on navy, error text, result values)
- the focus ring meets 3:1 against both the light and dark backgrounds
- a 2px `:focus-visible` outline with offset exists in the stylesheet
- the reduced-motion block neutralizes animations and transitions (and disables smooth scrolling)

Because the tokens are parsed from the CSS, changing a color without re-checking contrast turns this suite red.

## Browser tests (optional)

The browser suite drives a real Chromium through Playwright. Playwright is intentionally **not** a product dependency: the website ships with zero dependencies, and installing a browser automation tool is a development-time choice, not a runtime requirement.

Run it from any directory where `playwright` resolves. From the project root after a temporary install:

```bash
npm install --no-save playwright
node tests/browser-checks.js
```

Or from a separate dev directory (no files added to the package):

```bash
NODE_PATH=/path/to/dev/node_modules node tests/browser-checks.js
```

If Playwright cannot be resolved, the suite reports itself as skipped with instructions instead of silently passing — an unrun test is not a passing test.

The engine can be selected with an environment variable, so the same suite can be run against Firefox or WebKit after `npx playwright install firefox webkit`:

```bash
ALK_BROWSER=firefox node tests/browser-checks.js
ALK_BROWSER=webkit  node tests/browser-checks.js
```

The suite starts its own static server on `127.0.0.1` (a random port) and verifies:

- the page loads with no console errors and no unhandled exceptions
- every request stays on the local server, and calculator/FAQ/reset interactions trigger **zero** additional requests
- `localStorage` and `sessionStorage` stay empty during calculator use
- the calculator renders the reference results on load, rejects out-of-range and negative input with field errors and `—` results, restores all six defaults on reset, shows the no-payback message when net ≤ 0, and recalculates when each input changes
- desktop navigation shows all links; at 375px the menu opens via mouse and keyboard, exposes `aria-expanded`, moves focus into the menu, closes on Escape, and closes when a link is activated
- the skip link appears on keyboard focus with a visible outline; keyboard focus draws a ≥2px outline
- FAQ disclosures open and close with Enter and with the mouse
- no horizontal overflow at 320, 375, 768, 1024, or 1440 CSS px; the reset button is large enough to tap at 320px
- landmarks (`header`/`main`/`footer`), named navigations, one `h1`, and per-input accessible names/descriptions

### Known limitations of the browser suite

- **WebKit Tab-order emulation.** This Playwright build does not emulate sequential Tab focus in DOM order on WebKit (reproduced on a stripped page with no CSS or scripts: Tab oscillates between the body and the first input instead of walking the document). On WebKit, the two focus-order checks (skip link, mobile-menu keyboard flow) focus the control directly after one Tab press and verify the same behaviour — visible focus, correct `aria-expanded`, focus moving into the open menu, and the menu closing on link activation. On Chromium and Firefox the same tests drive real Tab navigation. Manual Tab-order verification in a real WebKit browser remains a recommended pre-publication check.

- It runs headless Chromium, Firefox, and WebKit on the machine that invokes it (all three verified for this release). It does not cover real touch devices, mobile gestures (tap targets, momentum scrolling), or iOS Safari with VoiceOver; those need manual checks on real hardware.
- True 200% browser zoom is not emulated; the 320px viewport is used as the tightest layout check instead.
- Automated contrast and structure checks do not replace a manual screen-reader pass.

## Manual checks worth doing after big edits

1. Tab through the whole page once with the keyboard: skip link, brand, nav toggle/menu, every calculator field, reset, FAQ summaries, every link. Nothing should trap focus or skip a control.
2. With the OS reduced-motion setting on, reload: the hero entrance should be instant, the pipeline diagram static.
3. Resize slowly from 1440 down to 320 and back; watch the nav switch and the calculator columns.
4. Run one accessibility spot-check (VoiceOver/NVDA) on the hero, calculator, and FAQ.
