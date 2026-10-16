# Changelog

All notable changes to AgencyLaunch Kit are recorded here. Dates are real
release dates; nothing in this file is reconstructed from invented history.

## 1.1.1 — 2026-10-16

Repository professionalism and public-release positioning. No product-code
changes.

- Rewrote `README.md` for conversion and trust: elevator pitch, problem,
  solution, audience, verified feature list and technology stack, benefits
  with practical limitations, tested setup and customization paths,
  pricing philosophy ("straightforward, low-cost licensing… no mandatory
  hosting subscription", price confirmed in writing per grant),
  commercial-licensing process, ownership and attribution, third-party
  notices, testing status, security-reporting note, and a
  not-a-business-outcomes disclaimer.
- Added `.github/ISSUE_TEMPLATE/bug_report.yml` — a defect-report form with
  no support or response-time promises.
- Re-verified the release contents and re-ran the test matrix after the
  documentation changes; results appended to `TEST-REPORT.md`.

## 1.1.0 — 2026-10-16

Licensing model and public release. No changes to the template code,
styles, or calculator logic.

- Replaced the buyer-use license with a proprietary source-available
  license (`LICENSE.txt` v1.1): public repository visibility grants
  viewing and evaluation only; commercial use, deployment, modification,
  redistribution, and resale require an explicit written license from the
  rights holder, requested via `Maverick_Limitless@icloud.com`.
- Rewrote `docs/LICENSE-GUIDANCE.md` as consumer-facing guidance: what the
  public repository allows, what it does not, how to request a license,
  how the written grant works, and what can be negotiated.
- Added `docs/COMMERCIAL-LICENSE.md` — a per-licensee grant template with
  placeholder fields (no fabricated terms, prices, or agreements).
- Added `docs/THIRD-PARTY-NOTICES.md` — audit result: the project contains
  no third-party components, fonts, images, scripts, or services.
- Added `docs/DEPLOYMENT.md` — host-agnostic static deployment guide.
- Rewrote `README.md` for prospective buyers: problem/solution/benefit
  positioning, verified feature list, licensing model, and the licensing
  inquiry process.
- Updated `TEST-REPORT.md` with the post-change verification results and
  the public-release security audit.

## 1.0.0 — 2026-10-16

Initial release.

- Complete single-page template (`index.html`) with skip link, responsive
  navigation and accessible mobile menu, dark editorial hero, principles
  section, four use-case cards, four-step process, ROI calculator, three
  service cards, three example packages, six FAQ disclosures, contact
  section, and footer.
- Design system in `styles.css`: navy / off-white / ink / lime tokens,
  system font stacks (serif display, sans body, mono labels), `clamp()`
  type scale, responsive to 320px, visible focus styles,
  `prefers-reduced-motion` support.
- ROI calculator in `script.js`: six validated inputs, local-only
  calculations, live formatted results, explicit no-payback handling,
  functional reset, no storage or network use.
- Original SVG assets: `assets/favicon.svg` and `assets/preview.svg`.
- Documentation: `README.md`, `docs/CUSTOMIZATION.md`, `docs/TESTING.md`,
  `docs/LICENSE-GUIDANCE.md`, `LICENSE.txt`, `TEST-REPORT.md`.
- Test suites: `tests/calculator.test.js` (20 unit tests),
  `tests/smoke-checks.js` (static checks), `tests/contrast-checks.js`
  (WCAG contrast), `tests/browser-checks.js` (optional Playwright suite).
