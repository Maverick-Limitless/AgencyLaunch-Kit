# Deployment guide

AgencyLaunch Kit is a static website template: plain HTML, CSS, and JavaScript files with no backend, no build step, and no runtime dependencies. Deployment means putting the files where a web server can serve them. This guide is host-agnostic — the same files work on any of the options below, and the owner chooses.

## What the site needs

- Any static file host or web server that can serve `.html`, `.css`, `.js`, and `.svg`.
- The four product files plus the two assets, kept in their existing relative layout (`index.html` at the root of whatever directory you upload).

That is the complete requirement list. There is no database, no server runtime, no package installation, and no environment configuration.

## Option A — preview locally first

From the project directory:

```bash
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

Any static server works the same way (`npx serve`, VS Code Live Server, nginx pointing at the directory). Serving over HTTP rather than double-clicking `index.html` is recommended because the page loads its stylesheet and script as separate files.

## Option B — static hosting platforms

Upload or connect the repository contents to any of these (all are common examples, not endorsements):

- **GitHub Pages** — serve from a branch or the `docs/` folder; the repository files can be published as-is.
- **Netlify / Vercel / Cloudflare Pages** — point at the repository; no build command and no output directory to configure, because there is no build.
- **Amazon S3 / Google Cloud Storage / Azure Blob** — upload the files and enable static website hosting.
- **Traditional web hosting (cPanel, shared hosting)** — upload via FTP/SFTP into the public web directory (`public_html` or equivalent).
- **Your own server** — any web server (nginx, Apache, Caddy) serving the directory as static files.

## Option C — bundling into an existing site

The page is self-contained: copy `index.html`, `styles.css`, `script.js`, and `assets/` into a subdirectory of an existing site and serve it there. Update nothing else; all references are relative.

## Before you deploy — required edits

The shipped content is example content. Before going live:

1. Replace the placeholder contact address `hello@example.com` (contact section and footer of `index.html`).
2. Replace the brand name in the header and footer.
3. Rewrite hero, service, and use-case copy; update the three example package prices.
4. Update `<title>`, the meta description, and the Open Graph tags in `<head>`.
5. Review the footer copyright line.

See the pre-publication checklist in `README.md` and the per-item instructions in `CUSTOMIZATION.md`.

## Verify after deploying

1. Load the live URL and confirm the page renders fully (hero, calculator, all sections).
2. Enter values in the ROI calculator and confirm results update; press **Reset to defaults** and confirm the six inputs return to 100 / 8 / 50 / 25 / 100 / 500.
3. Resize to roughly 320 CSS px wide (or open on a phone) and confirm the hamburger menu opens and closes, and there is no horizontal scrolling.
4. Optionally run the test suites once more against the deployed files — see `TESTING.md`.

## What deployment does not include

- Hosting, domains, SSL, DNS, and email delivery are the site owner's arrangements.
- The template performs no server-side processing, so nothing needs to be scaled or maintained on the backend.
- Updates to the template after a license grant are included only where a written agreement says so (`docs/LICENSE-GUIDANCE.md`).
