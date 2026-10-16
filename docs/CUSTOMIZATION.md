# Customization guide

> **License first.** Customizing, deploying, or building from these files is a use that requires an explicit written license — see [`LICENSE.txt`](../LICENSE.txt) and [`LICENSE-GUIDANCE.md`](LICENSE-GUIDANCE.md), or email Maverick_Limitless@icloud.com. This guide explains *how* the files work once you hold the rights your agreement grants.

Everything in AgencyLaunch Kit is plain text in three files. There is no build step, no configuration format, and no framework to learn. Edit the file, refresh the browser.

| File | Contains |
| --- | --- |
| `index.html` | all page content and structure |
| `styles.css` | design tokens, layout, typography |
| `script.js` | calculator defaults and limits, navigation behaviour |

Work through the sections in order the first time; later edits are usually single lines.

## 1. Brand name

The brand appears twice: the header and the footer.

```html
<a class="brand" href="#top">
  <svg class="brand__mark" ...>...</svg>
  <span class="brand__name">AgencyLaunch<span class="brand__name-suffix">Kit</span></span>
</a>
```

Change the visible text inside `.brand__name`. The `.brand__name-suffix` is the small outlined tag next to it — replace it with your own short tagline (for example `STUDIO`) or delete that `<span>` entirely. The same markup appears in the footer with `class="brand brand--footer"`.

Also update the copyright line at the bottom of the footer:

```html
<p>© <span id="footer-year">2026</span> Your Studio Name. ...</p>
```

The year fills in automatically via JavaScript; the static `2026` is the fallback before the script runs.

## 2. Hero headline and description

```html
<section class="hero" aria-labelledby="hero-title">
  <h1 class="hero__title" id="hero-title">Automate the repetitive work behind your business.</h1>
  <p class="hero__lede">We design, build, and maintain practical automations ...</p>
```

Keep the headline to one sentence that names a business outcome. Avoid quantified promises ("save 80% of costs") unless you can substantiate them for your own clients — the template deliberately ships without any.

The hero diagram below the copy is an original inline SVG with a `<title>` and `<desc>` for screen readers. If you change the diagram, update both, or mark the SVG `aria-hidden="true"` and rely on the `<figcaption>`.

## 3. Service categories and use cases

Use-case cards live in `#use-cases`; service cards in `#services`. Each is a `<article class="card">`:

```html
<article class="card">
  <h3 class="card__title">Lead qualification</h3>
  <p class="card__body">Every inbound enquiry gets a consistent first response ...</p>
  <p class="card__example"><span class="card__example-label">Example</span> A form submission is scored ...</p>
</article>
```

Keep the structure: title, one paragraph of substance, one concrete example. The `.card__example-label` span is the small mono label above the example line — rename it (`Typical shape`, `Example`, ...) as needed. Delete whole `<article>` blocks to have fewer cards, or duplicate one to add more; the CSS grid reflows on its own.

## 4. Sample pricing

Three example packages sit in `#pricing`. Each price looks like:

```html
<p class="package__price"><span class="package__currency">$</span>2,400<span class="package__period"> · example package</span></p>
```

Two things to change here:

1. The number and the period text (`/month`).
2. The `example package` marker. The page states that these are examples of website content, not a real offer. If your prices become your real prices, replace the marker text (or remove the `<span class="package__period">` when the value needs no qualifier) and adjust the section lede and the note under the cards.

### Example pricing vs. your real pricing

The distinction matters more than the numbers. Website templates ship with sample prices because visitors need to see *shape* — what a package includes, how it is framed, what it costs relative to the others. Those numbers describe the template author's hypothetical, not your business. Anything you publish becomes your offer: set it from your own costs, your market, and your capacity, and remove the "example" framing once it is real.

## 5. Contact email

The placeholder `hello@example.com` appears as a `mailto:` link in the contact section and again in the footer:

```html
<a class="button button--accent button--lg" href="mailto:hello@example.com">hello@example.com</a>
```

Search `index.html` for `hello@example.com` and replace every occurrence (there are three: contact button, contact note, footer link, plus one mention inside the footer placeholder note text).

The contact note paragraph explains that the address is a placeholder. Keep an equivalent instruction visible while the placeholder is in place, or delete the note once the real address is in.

If you later add a form, it needs a backend or a form service — this template deliberately contains no submit endpoint, and a form that silently discards input is worse than no form at all.

## 6. Colors

All colors are CSS custom properties in the `:root` block at the top of `styles.css`:

```css
:root {
  --color-navy: #101827;
  --color-background: #F7F8F5;
  --color-surface: #FFFFFF;
  --color-ink: #182230;
  --color-muted: #5B6675;
  --color-accent: #B7F36B;
  --color-border: #DCE1D9;
  /* derived tokens below the spec palette */
  --color-navy-raised: #1B2537;
  --color-on-navy: #F7F8F5;
  --color-on-navy-muted: #AAB6C4;
  --color-danger: #B42318;
  --color-danger-on-navy: #FFC9C0;
  ...
}
```

The identity is navy + off-white + ink + gray + lime. If you change a value, keep the family intact and check contrast afterwards:

```bash
node --test tests/contrast-checks.js
```

That test reads the tokens straight out of `styles.css` and computes the WCAG ratios, so a palette that breaks text contrast fails immediately. Rules of thumb:

- The accent (`--color-accent`) is a *highlight* on dark navy. It is never used as small text on the light background, and never as the only signal of a state — error states also carry a message and an `aria-invalid` flag.
- Text pairs (`--color-ink`, `--color-muted`) must keep 4.5:1 against `--color-background` and `--color-surface`.
- The focus ring token `--color-focus` flips to `--color-accent` on the dark sections.

## 7. Typography

Three system font stacks, no web fonts, no network requests:

```css
--font-display: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
```

Display is the editorial serif for headings; sans is body; mono is labels, eyebrows, form values, and results. The type scale is a set of `clamp()` tokens (`--text-display` … `--text-label`) also in `:root`; change the clamp values to resize the hierarchy globally, and the headings reflow at their existing breakpoints.

Because the stacks are system fonts, the page renders with whatever the visitor has installed — no flash of invisible text, no font request, and consistent rendering offline.

## 8. Navigation

Links live in the header's `<nav class="primary-nav">` and are duplicated in the footer. Each link is an anchor to a section `id`, so keeping them in sync is a matter of matching `href="#calculator"` with `id="calculator"` on the section. Renaming a section means editing both places (the smoke test verifies this — `tests/smoke-checks.js` fails on a dangling anchor).

The prominent call-to-action in the header (`.nav-cta`) points at `#contact`. Change its text or target like any other link.

The mobile menu is JavaScript-driven but fails safe: with JavaScript disabled, the menu simply renders as a static list on small screens. Its button is `.nav-toggle`, wired in `script.js` (open/close, `aria-expanded`, Escape, focus return, automatic close when a link is activated). If you restructure the header, keep the ids `primary-nav` and the classes `site-header`, `nav-toggle` intact so the behaviour keeps working.

## 9. FAQ content

Six native `<details>` disclosures in `#faq`. To answer a new question, copy an entire `<details class="faq__item">` block and replace the `<summary class="faq__question">` text and the paragraph inside `.faq__answer`. No JavaScript is involved, so keyboard operation and screen-reader semantics come for free.

## 10. Calculator defaults and limits

The six inputs are defined twice, and both places must agree:

- In `index.html`, each input carries `value`, `min`, and `max` attributes.
- In `script.js`, `CALC_DEFAULTS` holds the starting values and `CALC_LIMITS` the accepted ranges:

```js
var CALC_DEFAULTS = {
  tasksPerWeek: 100, minutesPerTask: 8, automationRate: 50,
  hourlyLaborCost: 25, monthlyToolCost: 100, setupCost: 500
};

var CALC_LIMITS = {
  tasksPerWeek: { min: 0, max: 100000 },
  minutesPerTask: { min: 0, max: 1440 },
  automationRate: { min: 0, max: 100 },
  hourlyLaborCost: { min: 0, max: 10000 },
  monthlyToolCost: { min: 0, max: 1000000 },
  setupCost: { min: 0, max: 10000000 }
};
```

To add a field (for example a currency other than USD, or an annual growth rate), you would add the row to both files, extend `CALC_FIELDS`, and the validation/render wiring picks it up automatically as long as the `calcFieldIds` map and results rows follow the same naming pattern.

The formatter functions (`formatHours`, `formatCurrency`) decide display precision; the tests in `tests/calculator.test.js` pin the reference outputs, so re-run them after any change:

```bash
node --test tests/calculator.test.js
```

If the reference expectations deliberately change (for example a different rounding), update the expected values in the test rather than loosening the tolerance — the tests should keep failing when a formula regresses.
