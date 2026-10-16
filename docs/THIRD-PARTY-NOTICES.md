# Third-party notices

Audit of the published AgencyLaunch Kit repository for third-party
components, assets, and code. Verified against the actual repository
contents; see "How this was verified" below.

## Audit result

**The repository contains no third-party components, assets, or code that
require third-party license notices.** All material is original to the
project:

| Area | Finding |
| --- | --- |
| Fonts | None loaded. Typography uses system font stacks only (`ui-serif`, `-apple-system`, `Segoe UI`, `Menlo`, and similar) — no web font service, no remote font files, no font files of any kind. |
| Images | No raster or photographic images. `assets/favicon.svg` and `assets/preview.svg` are original SVG drawings authored for this project. |
| Icons | No icon library or icon set. The inline SVGs in `index.html` (brand mark, pipeline diagram, the FAQ plus/minus marker drawn as an inline data-URI SVG in `styles.css`) are original. |
| Scripts / libraries | None. `script.js` is original vanilla JavaScript with no dependencies and no imports. No framework, polyfill, or utility library. |
| Stylesheets | `styles.css` is original CSS. No framework, reset package, or preprocessor output. |
| Services / APIs | None. No analytics, trackers, pixels, fonts-as-a-service, embeds, or API calls of any kind. |
| Test tooling | Tests use only Node.js built-ins (`node:test`, `node:assert`, `node:fs`, `node:http`, `node:child_process`). Playwright, where used, is an optional development-time tool installed outside the package — it is not part of the product and its license does not affect the shipped files. |
| Documentation | All documentation is written for this project. |

## Claims not made

- No part of the project incorporates code or assets copied from other
  templates, libraries, or websites.
- No asset is licensed from a third party, and no third-party license
  file (MIT, Apache-2.0, CC-BY, SIL OFL, or similar) applies to the
  materials as published.

## If you add third-party material

A licensed customization may add third-party fonts, images, libraries, or
snippets. Those materials remain subject to their own licenses, and
carrying the required notices is the licensee's responsibility — this
document covers the project as published only.

## How this was verified

- Grep scans of every shipped file for external URLs, remote assets, font
  references, tracker patterns, and import/require statements (`script.js`
  contains none beyond its Node export guard).
- Inspection of every `src`, `href`, and CSS `url()` reference in
  `index.html` and `styles.css`: all resolve to files in this repository.
- The automated static suite asserts these properties on every run:
  `node --test tests/smoke-checks.js` fails the build if an external
  script, stylesheet, or hotlinked resource is introduced, or if a
  credential pattern appears in any product file.
- `tests/browser-checks.js` asserts at runtime that the page makes no
  request to anything outside the local server.
