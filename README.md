# AgencyLaunch Kit

**Your AI Automation Business. Ready for the Web.**

A customizable, static website template for independent AI automation consultants and small automation agencies — from automation expertise to a professional online presence.

![Preview of AgencyLaunch Kit](assets/preview.svg)

> **Licensing:** this repository is public for inspection, not open source. Viewing the code is free; **commercial use requires an explicit written license.** See [Licensing](#licensing-model) or email **Maverick_Limitless@icloud.com**.

## What is AgencyLaunch Kit?

A complete, single-page website template for a business that sells AI automation services. It contains the pages' full structure — a landing page with hero, services, use cases, process, example pricing, FAQ, and contact — plus a working ROI calculator that runs entirely in the visitor's browser. It is a source-code template you customize and deploy yourself: not a hosted service, not a SaaS product, and not a website builder.

## Who is it for?

- Independent AI automation consultants who need a credible web presence.
- Small AI automation agencies launching or replacing a website.
- Solo consultants and freelancers selling workflow integration or automation services.
- Small service businesses that need a clear way to explain their services and their value.

## The problem

A small agency needs a credible website: a place to communicate its services, explain what automation is worth, present its offering, and help a prospect see the return. Building that from scratch takes design, frontend implementation, responsive layout work, accessibility decisions, and testing — before the first customer ever sees it. Independent consultants rarely want to spend their selling time on any of that.

## The solution

AgencyLaunch Kit provides a ready-made, tested website foundation. You inspect the actual code here, obtain the license you need, customize the copy and design for your business, and deploy static files to any host. Nothing is hidden behind a builder or a service — the source is the product.

## Key benefits

- A faster starting point than building every page element from scratch.
- Clear service and value communication, with content written for an automation-services audience.
- A working, browser-based ROI calculator (verified by tests) — no backend, no data leaves the visitor's browser.
- Responsive layout verified at 320, 375, 768, 1024, and 1440 CSS px.
- No build step and no external runtime dependencies: no frameworks, no web fonts, no third-party scripts, no CDNs.
- Accessibility-focused markup: skip link, semantic landmarks, labelled controls, keyboard-operable navigation and FAQ, visible focus styles, reduced-motion support.
- Full control of the source code — modify it as your licensed rights allow.
- Documentation for customization, testing, deployment, and licensing.

## Feature list (verified against the code)

| Feature | Detail |
| --- | --- |
| Complete landing page | Hero with original SVG process diagram, principles, 4 use-case cards, 4-step process, ROI calculator, 3 service cards, 3 example packages, 6 FAQ disclosures, contact section, footer |
| ROI calculator | 6 validated inputs; local calculations; live formatted results; reset; explicit "no payback" handling; no storage or network use |
| Responsive navigation | Sticky header with accessible mobile menu (`aria-expanded`, Escape, focus handling) |
| Design system | CSS custom properties (navy / off-white / ink / lime); system font stacks; `clamp()` type scale |
| Original assets | `assets/favicon.svg`, `assets/preview.svg` — hand-authored SVG, no stock or third-party art |
| Tests | 113 automated checks: 20 calculator unit tests, 16 static checks, 5 contrast checks, 24 browser checks × 3 engines (Chromium, Firefox, WebKit) |
| Dependencies | None. No build step. No network requests at runtime |

## Preview

[`assets/preview.svg`](assets/preview.svg) is a genuine render of the template's key sections (hero, pipeline diagram, use-case cards). To preview the real thing locally, follow the quick start below.

## Quick start

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/AgencyLaunch-Kit.git
cd AgencyLaunch-Kit
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

(`YOUR-GITHUB-USERNAME` is the account that hosts this repository.)

Any static file server works. There is nothing to install and nothing to build.

## Customization

See [`docs/CUSTOMIZATION.md`](docs/CUSTOMIZATION.md) for step-by-step instructions: brand name, hero copy, services, sample pricing, contact email, color tokens, typography, navigation, FAQ content, and calculator defaults. In short: content lives in `index.html`, design tokens at the top of `styles.css`, calculator defaults and limits in `script.js`.

Before publishing you must replace the placeholder contact address (`hello@example.com` in the contact section and footer), the brand name, and the example package prices — the page itself marks these as placeholders.

## Testing

```bash
node --test tests/calculator.test.js     # 20 calculator unit tests
node --test tests/smoke-checks.js        # 16 static checks
node --test tests/contrast-checks.js     # 5 WCAG contrast checks
```

The browser suite (`tests/browser-checks.js`, 24 checks per engine) is optional and needs Playwright installed outside the package. Full commands, prerequisites, expected output, and known limitations are in [`docs/TESTING.md`](docs/TESTING.md); recorded results are in [`TEST-REPORT.md`](TEST-REPORT.md).

## Deployment

The site is static files. Upload the contents of this repository to any static host (GitHub Pages, Netlify, Cloudflare Pages, S3, traditional web hosting, or your own server) and serve — no build, no backend. Host-agnostic instructions and post-deploy verification are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Deploying, hosting, operating, and maintaining the resulting website are the site owner's responsibility.

## Licensing model

**Source-available, proprietary — not open source.** Public visibility of this repository is for evaluation and discovery. It grants no commercial-use rights. Without an explicit written license you may not deploy, modify, redistribute, resell, or commercially use the template. The full terms are in [`LICENSE.txt`](LICENSE.txt).

## Interested in using AgencyLaunch Kit commercially?

**Email Maverick_Limitless@icloud.com** with your intended use, business or project, number of websites or deployments, and any modification or client-delivery requirements. Commercial permissions are considered individually and are granted only through an explicit written agreement.

How it works: inspect this repository → email your intended use → discuss scope, rights, and terms → complete the agreed terms → receive an explicit written license → receive the source files under the granted rights → deploy and maintain independently unless separately contracted. Consumer-facing answers to the usual questions are in [`docs/LICENSE-GUIDANCE.md`](docs/LICENSE-GUIDANCE.md), and the grant template is in [`docs/COMMERCIAL-LICENSE.md`](docs/COMMERCIAL-LICENSE.md).

An email inquiry alone does not grant a license.

## Support and maintenance boundaries

- No support, maintenance, updates, or hosting are included by default — not by this repository and not by a license unless the written agreement says so.
- The licensee is responsible for their own hosting, deployment, operations, and maintenance of any resulting website.
- If you want support, custom development, or a defined update period, raise it during licensing so it can be agreed in writing.

## Third-party notices

The project contains no third-party components, fonts, images, scripts, or services. The full audit is in [`docs/THIRD-PARTY-NOTICES.md`](docs/THIRD-PARTY-NOTICES.md), and the automated test suite fails if an external resource or credential is introduced.

## Project status and known limitations

Complete and tested (see [`TEST-REPORT.md`](TEST-REPORT.md) for the evidence and its limitations). Honest limits:

- Content is example content — copy, services, and the three package prices are placeholders to customize.
- The ROI calculator is an arithmetic estimator, not financial software: no time series, no saving or sharing, USD display only.
- Screen-reader testing and real-device gesture testing were not performed by the project author; automated accessibility checks pass.
- The template needs a license before commercial use — see above.

## Changelog and test report

- [`CHANGELOG.md`](CHANGELOG.md) — release history.
- [`TEST-REPORT.md`](TEST-REPORT.md) — what was actually verified, how, and what was not run.

---

© 2026 Maverick Limitless. AgencyLaunch Kit is original work; commercial use requires an explicit written license. Licensing contact: **Maverick_Limitless@icloud.com**
