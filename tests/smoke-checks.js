/* ==========================================================================
   smoke-checks.js — static verification of the shipped files (spec 15.1)
   Run: node --test tests/smoke-checks.js   (or node --test tests/)
   Checks the product, not the implementation: every assertion inspects the
   real files on disk.
   ========================================================================== */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const html = read("index.html");
const css = read("styles.css");
const js = read("script.js");

const requiredFiles = [
  "index.html", "styles.css", "script.js",
  "assets/favicon.svg", "assets/preview.svg",
  "docs/CUSTOMIZATION.md", "docs/TESTING.md", "docs/LICENSE-GUIDANCE.md",
  "README.md", "LICENSE.txt", "CHANGELOG.md", "TEST-REPORT.md"
];

test("required files exist and are non-trivial", () => {
  for (const file of requiredFiles) {
    const full = path.join(ROOT, file);
    assert.ok(fs.existsSync(full), "missing: " + file);
    assert.ok(fs.statSync(full).size > 200, "suspiciously small: " + file);
  }
});

test("referenced local assets and stylesheets resolve to real files", () => {
  const refs = [];
  const tagPattern = /<(?:link|script|img)\b[^>]*>/gi;
  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    const attr = /\b(?:href|src)\s*=\s*"([^"]+)"/i.exec(match[0]);
    if (attr && !/^(?:https?:|mailto:|tel:|data:)/i.test(attr[1])) { refs.push(attr[1]); }
  }
  assert.ok(refs.length >= 3, "expected the stylesheet, script and favicon references");
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(ROOT, ref)), "dangling reference: " + ref);
  }
});

test("internal links point to IDs that exist in the document", () => {
  const ids = new Set();
  const idPattern = /\bid\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = idPattern.exec(html)) !== null) { ids.add(match[1]); }

  const anchors = [];
  const anchorPattern = /\shref\s*=\s*"([^"]+)"/g;
  while ((match = anchorPattern.exec(html)) !== null) {
    if (match[1].startsWith("#") && match[1].length > 1) { anchors.push(match[1].slice(1)); }
  }
  assert.ok(anchors.length >= 10, "expected navigation, footer and section links");
  for (const anchor of anchors) {
    assert.ok(ids.has(anchor), "link target #" + anchor + " does not exist");
  }
});

test("no duplicate IDs in index.html", () => {
  const seen = new Set();
  const duplicates = [];
  const idPattern = /\bid\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = idPattern.exec(html)) !== null) {
    if (seen.has(match[1])) { duplicates.push(match[1]); }
    seen.add(match[1]);
  }
  assert.deepEqual(duplicates, [], "duplicate IDs: " + duplicates.join(", "));
});

test("every form control has an associated label", () => {
  const inputs = [];
  const inputPattern = /<input\b[^>]*>/gi;
  let match;
  while ((match = inputPattern.exec(html)) !== null) { inputs.push(match[0]); }
  assert.equal(inputs.length, 6, "the calculator should have exactly six inputs");

  for (const tag of inputs) {
    const id = /\bid\s*=\s*"([^"]+)"/i.exec(tag);
    assert.ok(id, "input without id: " + tag);
    const labelled = new RegExp('for\\s*=\\s*"' + id[1] + '"').test(html);
    const ariaNamed = /\baria-label(?:ledby)?\s*=/.test(tag);
    assert.ok(labelled || ariaNamed, "input #" + id[1] + " has no associated label");
  }
});

test("each calculator input carries its own hint and error slot", () => {
  for (const id of ["tasks", "minutes", "rate", "labor", "tools", "setup"]) {
    assert.ok(html.includes('id="calc-' + id + '"'), "missing input calc-" + id);
    assert.ok(html.includes('id="calc-' + id + '-hint"'), "missing hint for calc-" + id);
    assert.ok(html.includes('id="calc-' + id + '-error"'), "missing error slot for calc-" + id);
  }
});

test("heading hierarchy is sensible: one h1, no skipped levels", () => {
  const levels = [];
  const headingPattern = /<h([1-6])\b/g;
  let match;
  while ((match = headingPattern.exec(html)) !== null) { levels.push(Number(match[1])); }
  assert.equal(levels.filter((l) => l === 1).length, 1, "exactly one h1");
  for (let i = 1; i < levels.length; i++) {
    assert.ok(levels[i] - levels[i - 1] <= 1, "heading jumps from h" + levels[i - 1] + " to h" + levels[i]);
  }
});

test("document metadata is complete", () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta charset="utf-8">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /<title>[^<]{20,}<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]{50,}">/);
  assert.match(html, /<a class="skip-link" href="#main">/);
  assert.ok(html.includes('id="main"'), "skip link target exists");
});

test("inline SVGs are either labelled or hidden from assistive tech", () => {
  const svgPattern = /<svg\b[^>]*>/gi;
  let match;
  let count = 0;
  while ((match = svgPattern.exec(html)) !== null) {
    count++;
    const tag = match[0];
    const labelled = /\brole="img"[\s\S]*?aria-labelledby/.test(tag) || /aria-label=/.test(tag);
    const hidden = /aria-hidden="true"/.test(tag);
    assert.ok(labelled || hidden, "unlabelled, un-hidden svg: " + tag.slice(0, 80));
  }
  assert.ok(count >= 3, "expected the brand marks and the pipeline diagram");
});

test("FAQ uses native disclosures", () => {
  const details = html.match(/<details\b/g) || [];
  assert.ok(details.length >= 5, "at least five FAQ disclosures, found " + details.length);
  assert.ok((html.match(/<summary\b/g) || []).length >= 5, "each disclosure has a summary");
});

test("JavaScript files parse without syntax errors", () => {
  const files = ["script.js", "tests/calculator.test.js", "tests/smoke-checks.js", "tests/contrast-checks.js", "tests/browser-checks.js"];
  for (const file of files) {
    if (!fs.existsSync(path.join(ROOT, file))) { continue; }
    execFileSync(process.execPath, ["--check", path.join(ROOT, file)]);
  }
});

test("CSS braces balance and the design tokens exist", () => {
  const opens = (css.match(/{/g) || []).length;
  const closes = (css.match(/}/g) || []).length;
  assert.equal(opens, closes, "unbalanced braces: " + opens + " vs " + closes);
  for (const token of ["--color-navy", "--color-background", "--color-surface", "--color-ink", "--color-muted", "--color-accent", "--color-border", "--radius-small", "--radius-medium", "--radius-large", "--container-width"]) {
    assert.ok(css.includes(token), "missing token " + token);
  }
  assert.match(css, /prefers-reduced-motion/, "reduced-motion support missing");
  assert.match(css, /@media \(max-width: 860px\)/, "mobile navigation breakpoint missing");
});

test("no placeholder markers remain in release-critical code", () => {
  for (const file of ["index.html", "styles.css", "script.js"]) {
    const source = read(file);
    assert.ok(!/TODO|FIXME|XXX|HACK/.test(source), file + " contains a placeholder marker");
    assert.ok(!/lorem ipsum/i.test(source), file + " contains lorem ipsum");
  }
});

test("no secrets or credentials anywhere in the product files", () => {
  const patterns = [
    /api[_-]?key\s*[:=]\s*["'][^"']{8,}/i,
    /secret\s*[:=]\s*["'][^"']{8,}/i,
    /password\s*[:=]\s*["'][^"']{4,}/i,
    /BEGIN [A-Z ]*PRIVATE KEY/,
    /AKIA[0-9A-Z]{16}/,
    /ghp_[A-Za-z0-9]{20,}/,
    /sk-[A-Za-z0-9]{20,}/
  ];
  const files = ["index.html", "styles.css", "script.js", "assets/favicon.svg", "assets/preview.svg", "README.md", "LICENSE.txt", "CHANGELOG.md", "TEST-REPORT.md", "docs/CUSTOMIZATION.md", "docs/TESTING.md", "docs/LICENSE-GUIDANCE.md"];
  for (const file of files) {
    const source = read(file);
    for (const pattern of patterns) {
      assert.ok(!pattern.test(source), file + " may contain a secret (" + pattern + ")");
    }
  }
});

test("no external scripts, trackers, or hotlinked resources", () => {
  const externalAttr = /(?:src|href)\s*=\s*"https?:\/\//gi;
  const externalCss = /url\(\s*["']?https?:\/\//gi;
  assert.ok(!externalAttr.test(html), "index.html references an external resource");
  assert.ok(!externalCss.test(css), "styles.css references an external resource");

  const scriptTags = html.match(/<script\b[^>]*>/gi) || [];
  assert.equal(scriptTags.length, 1, "only the local script tag is allowed");
  assert.match(scriptTags[0], /src="script\.js"/, "the single script must be script.js");

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    if (/rel="stylesheet"/.test(tag)) {
      assert.match(tag, /href="styles\.css"/, "stylesheet must be local");
    }
  }
});

test("contact address is the documented placeholder", () => {
  assert.ok(html.includes("mailto:hello@example.com"), "mailto placeholder missing");
  assert.ok(/replace\s+(?:<code>\s*)?hello@example\.com/i.test(html), "replacement instruction missing");
});
