# Test report — AgencyLaunch Kit

Verification evidence for the 1.0.0 release and the 1.1.0 licensing/public-release
update (2026-10-16). Every row records what was actually run, the actual result,
and the limitations that apply. A test that could not be executed is recorded as
`NOT RUN`, never as a pass.

- **Deliverable:** the `agencylaunch-kit` package directory (this repository)
- **Environment:** macOS (arm64); Node.js v26.8.1; Python 3.14.6; Playwright 1.64.1 installed in a development directory **outside** this package; Chromium, Firefox, and WebKit browsers downloaded to the Playwright browser cache.
- **Reproduce:** commands are listed per category; `docs/TESTING.md` is the full guide.

## Test results

| # | Category | Method / command | Actual result | Status |
| --- | --- | --- | --- | --- |
| 1 | Calculator unit tests (20 cases, spec 8.7) | `node --test tests/calculator.test.js` | 20 tests, 20 pass, 0 fail. Reference case matches spec 8.6 exactly: 57.7778 h, 28.8889 h, $722.22, $622.22, 0.8036 months. Expected values are computed from the spec formulas, not read back from the implementation. | PASS |
| 2 | Static checks (structure, references, labels, secrets, externals) | `node --test tests/smoke-checks.js` | 16 tests, 16 pass, 0 fail. Required files present and non-trivial; all local references resolve; all internal anchors resolve; no duplicate IDs; all six inputs labelled with hint + error slots; one `h1`, no skipped heading levels; metadata complete; SVGs labelled or hidden; 6 native FAQ disclosures; all JS passes `node --check`; CSS braces balance with all spec tokens; no TODO/FIXME/lorem ipsum; no secret patterns; no external scripts/trackers/hotlinked resources; contact placeholder present with its replacement instruction. | PASS |
| 3 | Palette contrast (WCAG) | `node --test tests/contrast-checks.js` | 5 tests, 5 pass, 0 fail. Tokens parsed live from `styles.css`. All 11 text pairs ≥ 4.5:1 (lowest measured: muted text on background, 5.41:1). Focus ring and card borders ≥ 3:1 / 1.2:1 as required. 2px `:focus-visible` outline with offset present. Reduced-motion block neutralises animations, transitions and smooth scrolling. | PASS |
| 4 | Browser suite — Chromium | `ALK_BROWSER=chromium node tests/browser-checks.js` (Playwright 1.64.1, Chromium 1248, served over the suite's own local HTTP server) | 24 tests, 24 pass, 0 fail. No console errors; zero additional network requests from calculator/FAQ/reset interactions and none off-origin; `localStorage`/`sessionStorage` stay empty; default results render on load; out-of-range and negative inputs rejected with field errors and `—` results; reset restores all six defaults; no-payback message when net ≤ 0; recalculates per input; desktop nav complete; mobile menu opens via mouse and keyboard with `aria-expanded`, focus moving in, Escape and link-activation closing it; skip link visible on focus with outline; FAQ keyboard-operable; no horizontal overflow at 320/375/768/1024/1440; landmarks, names and descriptions present. | PASS |
| 5 | Browser suite — Firefox | `ALK_BROWSER=firefox node tests/browser-checks.js` | 24 tests, 24 pass, 0 fail. Same coverage as Chromium. | PASS |
| 6 | Browser suite — WebKit | `ALK_BROWSER=webkit node tests/browser-checks.js` | 24 tests, 24 pass, 0 fail. Same coverage; the two focus-order checks reach the control via programmatic focus after one Tab press because this Playwright build does not emulate sequential Tab focus on WebKit (see limitations). | PASS |
| 7 | Local HTTP server (documented run command) | `python3 -m http.server 8000` then `curl` each asset | `index.html` 200 text/html; `styles.css` 200 text/css; `script.js` 200 text/javascript; `assets/favicon.svg` 200 image/svg+xml. | PASS |
| 8 | Visual review (rendered screenshots) | Playwright screenshots at 1440/768/375 CSS px, hero and full page | Reviewed: hero, principles, use cases, process, calculator (inputs + results), services, pricing, FAQ, contact, footer all render as designed; mobile layout stacks correctly with visible hamburger. One defect found and fixed during review — see "Defects found and fixed" below. | PASS |
| 9 | Keyboard-only walkthrough | Automated: skip link, mobile menu, FAQ disclosure, focus outlines (suites 4–6) | All automated keyboard checks pass in all three engines. Manual keyboard walkthrough of the full page was **not** performed by a human. | PARTIAL |
| 10 | Screen-reader verification | — | Not performed: no screen reader available in this environment. Semantic structure (landmarks, labels, names, descriptions) is verified programmatically. | NOT RUN |
| 11 | 200% browser zoom | — | Not emulated in this environment; the 320px viewport was used as the tightest layout check instead. | NOT RUN |
| 12 | Real touch-device gestures | — | Not performed (no devices). Tap-target size at 320px is verified programmatically. | NOT RUN |
| 13 | Re-run of suites 1–6 after the 1.1.0 documentation/licensing changes | `node --test tests/calculator.test.js tests/smoke-checks.js tests/contrast-checks.js` and the three-engine browser suite | Automated suites unaffected by documentation edits; all executed again after the change with identical results (see below). | PASS |
| 14 | Licensing consistency review | Manual review of `LICENSE.txt`, `README.md`, `LICENSE-GUIDANCE.md`, `COMMERCIAL-LICENSE.md`, `THIRD-PARTY-NOTICES.md`, `DEPLOYMENT.md`, `CUSTOMIZATION.md`, `CHANGELOG.md` | One coherent policy: public repository = viewing/evaluation only; commercial use requires an explicit written license; `Maverick_Limitless@icloud.com` used as the single licensing contact; no document states or implies general commercial-use permission; no standard open-source license name is used. | PASS |
| 15 | Public-release security and IP audit | Grep scans for credentials, `.env` files, absolute local paths, caches, build artifacts; review of every external URL/asset reference; Git history review | No secrets, tokens, keys, or credentials found. No `.env` files, no `node_modules`, no caches or temp files, no third-party assets. One finding: an absolute local filesystem path in the 1.0.0 test report — removed before publication. This repository's initial commit contains only the intended product files. | PASS (1 finding, fixed) |
| 16 | GitHub publication (first attempt, after 1.1.0) | Attempted: `gh repo create AgencyLaunch-Kit --public --description "…" --source . --push` | **BLOCKED.** `gh` returned: "You are not logged into any GitHub hosts. To log in, run: `gh auth login`" — the same for `gh auth status` and `gh repo list`. No `GH_TOKEN`/`GITHUB_TOKEN` in the environment, no git credential helper, no SSH key. Publication was **not** performed and is not claimed. Release commit `d74c4d7` on branch `main` is ready locally. | BLOCKED |
| 17 | Positioning consistency review | Manual cross-read of `README.md`, `LICENSE.txt`, `LICENSE-GUIDANCE.md`, `COMMERCIAL-LICENSE.md`, `THIRD-PARTY-NOTICES.md`, `DEPLOYMENT.md`, `CUSTOMIZATION.md`, `TESTING.md`, `CHANGELOG.md`, and the site's `index.html` | One story end-to-end: inspect → license → adapt → deploy. Pricing language carries no invented price, discount, or scarcity; price is confirmed in writing per grant. No standard open-source classification used; no contradiction where the license permits something the docs forbid (the docs grant nothing beyond viewing; the license's evaluation clause matches). The site keeps `hello@example.com` as an explicitly marked, buyer-editable contact placeholder — distinct from the licensing address `Maverick_Limitless@icloud.com`, which is not presented as public customer contact. | PASS |
| 18 | Second public-release security/IP sweep (after 1.1.1 edits) | Grep scans for credentials, `.env` files, absolute local filesystem paths (user-home and temp-directory patterns), caches, build artifacts; review of every external URL/asset reference; review of tracked files and all commits of Git history | No secrets or credentials; no `.env`; no absolute local paths; no third-party assets; no caches or artifacts. Git history (3 commits) contains only intended project files. No ownership overstatement; copyright line is "Maverick Limitless", 2026. | PASS |
| 19 | Test matrix re-run after the 1.1.1 documentation edits | `node --test tests/calculator.test.js tests/smoke-checks.js tests/contrast-checks.js` and `tests/browser-checks.js` on Chromium, Firefox, WebKit | Node suites: 41/41 pass. Browser suite: 24/24 pass per engine (see final-run log). No test weakened, deleted, or bypassed. | PASS |
| 20 | GitHub publication (attempts after 1.1.0 and 1.1.1) | `gh auth status`; `gh api user`; `gh repo view AgencyLaunch-Kit`; attempted `gh repo create AgencyLaunch-Kit --public --source . --push --description "…"` | **BLOCKED — no GitHub authentication exists in this environment.** Every check returned the same message: "You are not logged into any GitHub hosts. To log in, run: `gh auth login`" (or populate `GH_TOKEN`). No `gh` login, no `GH_TOKEN`/`GITHUB_TOKEN`, no git credential helper, no SSH key (`~/.ssh` does not exist, `~/.config/gh/hosts.yml` does not exist). Nothing was pushed; no repository was created; no visibility is claimed. Release head is commit `3cff14b` on branch `main`, ready to push as-is. | BLOCKED |

## Defects found and fixed during verification

1. **Scroll-reveal could leave below-fold content invisible.** The first full-page screenshot showed the principles, use-case, and process sections blank at `opacity: 0` — their reveal depended on IntersectionObserver firing, which a screenshot capture (and any environment where the observer does not run) never triggers. Fixed by removing the scroll-reveal entirely and replacing it with a CSS-only hero entrance animation that works without JavaScript and degrades to nothing under `prefers-reduced-motion`. Re-verified by re-capturing screenshots (all sections render) and re-running all suites.
2. **Lime section labels on the off-white background failed text contrast** (found during self-review before release; would have failed suite 3). Labels now use the muted color with a lime dot marker.
3. **Three test-authoring defects in the first test draft** (wrong expected value for the reset case, comparing against an undefined field, asserting `formatPayback(null)` must be a string) were corrected in the tests — the calculator implementation itself needed no fixes for those.
4. **Two WebKit failures were an environment artifact, not page defects**, reproduced on a stripped page with no CSS or scripts. Handled by engine-aware test adaptation, documented above — not by weakening the assertions on Chromium and Firefox.

## Release gates

| Gate | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| G0 | Scope matches static-template scope | PASS | No framework, backend, build step, dependencies, or network calls; verified by suites 2 and 4 |
| G1 | Visual quality: complete, coherent, responsive | PASS | Suite 8 (screenshots at 1440/768/375 and overflow checks at all five required widths in suites 4–6) |
| G2 | Functionality: interactive features work, edge cases handled | PASS | Suites 1 (20 unit cases incl. boundaries and invalid input) and 4–6 (DOM behaviour, validation, reset) |
| G3 | Accessibility: required checks completed, issues disclosed | PASS with disclosed limits | Suites 2–6 (labels, names, landmarks, keyboard, focus). Screen-reader and manual checks NOT RUN — disclosed |
| G4 | Code quality: maintainable, no release-blocking defects | PASS | `node --check` clean; single-file pure logic separated from DOM wiring; no TODO/FIXME; defect log above |
| G5 | Security and privacy: no prohibited functionality, no critical issues | PASS | Suite 2 (no secrets, no external scripts, no trackers); suites 4–6 (zero external requests, no storage writes); source scan for `eval`/`innerHTML`/`fetch`/storage returns nothing |
| G6 | Documentation and license complete and consistent | PASS | README, CUSTOMIZATION.md, TESTING.md, LICENSE-GUIDANCE.md, LICENSE.txt, CHANGELOG.md, this report; docs match the verified commands |
| G7 | Test evidence: tests executed or blockers documented | PASS | 65 automated checks executed (20 + 16 + 5 + 24×3); every unexecuted category documented as NOT RUN with the reason |
| G8 | Evidence-based release decision | READY FOR OWNER REVIEW | See decision below |

## Known issues and limitations

- Content is example content: brand, copy, services, and the three package prices are placeholders; `hello@example.com` must be replaced before publication (flagged on the page itself and in the README checklist).
- The browser suite requires Playwright, which is intentionally not a product dependency; a buyer must install it to re-run (documented in `docs/TESTING.md`).
- Screen-reader verification, a full manual keyboard walkthrough, real touch-device gestures, and true 200%-zoom emulation were not performed in this environment (NOT RUN rows above). Automated equivalents passed.
- WebKit Tab-order emulation in this Playwright build is unreliable; the limitation, the evidence, and the recommended manual check are documented in `docs/TESTING.md`.
- The ROI calculator is an arithmetic estimator: no time series, no saving/sharing, USD display formatting only.
- No analytics, cookies, or consent banner exist — by design, not by omission.

## Decision

**READY FOR OWNER REVIEW** — all release gates pass on executed evidence; no P0 or P1 defects remain. This is readiness for the owner's review, not commercial validation or legal certification.

For the 1.1.1 public-release mandate: the repository content, licensing, positioning, documentation, security audits, and local commits are complete and verified; **only the GitHub publication step is outstanding, blocked by missing GitHub authorization in the build environment** (rows 16 and 20). The repository must be created and pushed by the owner using the commands in the release report.
