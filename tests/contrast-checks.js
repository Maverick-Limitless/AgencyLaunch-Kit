/* ==========================================================================
   contrast-checks.js — verifies the actual contrast of the shipped palette
   (spec 6.2 / 9). Token values are read from styles.css, so changing the
   palette without checking contrast fails this test.
   Run: node --test tests/contrast-checks.js
   ========================================================================== */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

/* Read the custom properties out of the real stylesheet. */
const tokens = {};
const rootBlock = /:root\s*\{([\s\S]*?)\}/.exec(css);
assert.ok(rootBlock, ":root block not found in styles.css");
const declPattern = /(--[a-z-]+)\s*:\s*([^;]+);/gi;
let decl;
while ((decl = declPattern.exec(rootBlock[1])) !== null) {
  tokens[decl[1]] = decl[2].trim();
}

function hexToRgb(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  assert.ok(match, "not a 6-digit hex color: " + value);
  return {
    r: parseInt(match[1].slice(0, 2), 16),
    g: parseInt(match[1].slice(2, 4), 16),
    b: parseInt(match[1].slice(4, 6), 16)
  };
}

function relativeLuminance(rgb) {
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const lf = relativeLuminance(hexToRgb(foreground));
  const lb = relativeLuminance(hexToRgb(background));
  const lighter = Math.max(lf, lb);
  const darker = Math.min(lf, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function tokenValue(name) {
  let value = tokens[name];
  assert.ok(value !== undefined, "token " + name + " not defined");
  /* Resolve one level of var() indirection (e.g. --color-focus: var(--color-navy)). */
  const ref = /^var\((--[a-z-]+)\)$/.exec(value);
  if (ref) { value = tokens[ref[1]]; }
  assert.ok(value !== undefined, "token " + name + " unresolved");
  return value;
}

/* Text pairs that must meet WCAG AA (4.5:1) at the sizes used on the page. */
const TEXT_PAIRS = [
  { name: "body ink on background", fg: "--color-ink", bg: "--color-background", min: 4.5 },
  { name: "body ink on surface", fg: "--color-ink", bg: "--color-surface", min: 4.5 },
  { name: "muted text on background", fg: "--color-muted", bg: "--color-background", min: 4.5 },
  { name: "muted text on surface", fg: "--color-muted", bg: "--color-surface", min: 4.5 },
  { name: "primary button label on accent", fg: "--color-navy", bg: "--color-accent", min: 4.5 },
  { name: "hero body text on navy", fg: "--color-on-navy", bg: "--color-navy", min: 4.5 },
  { name: "hero secondary text on navy", fg: "--color-on-navy-muted", bg: "--color-navy", min: 4.5 },
  { name: "footer text on navy", fg: "--color-on-navy-muted", bg: "--color-navy", min: 4.5 },
  { name: "error text on surface", fg: "--color-danger", bg: "--color-surface", min: 4.5 },
  { name: "error status on navy", fg: "--color-danger-on-navy", bg: "--color-navy", min: 4.5 },
  { name: "accent result values on navy", fg: "--color-accent", bg: "--color-navy", min: 4.5 }
];

/* Non-text pairs (focus rings, form borders) that must meet 3:1. */
const UI_PAIRS = [
  { name: "focus ring on background", fg: "--color-focus", bg: "--color-background", min: 3 },
  { name: "focus ring on navy", fg: "--color-focus-on-navy", bg: "--color-navy", min: 3 },
  { name: "card border on background", fg: "--color-border", bg: "--color-background", min: 1.2 }
];

test("palette tokens are defined as 6-digit hex values", () => {
  for (const name of ["--color-navy", "--color-background", "--color-surface", "--color-ink", "--color-muted", "--color-accent", "--color-border", "--color-on-navy-muted", "--color-danger", "--color-danger-on-navy"]) {
    assert.match(tokenValue(name), /^#[0-9a-f]{6}$/i, name + " should be a hex color, got " + tokenValue(name));
  }
});

test("text pairs meet WCAG AA contrast (4.5:1)", () => {
  for (const pair of TEXT_PAIRS) {
    const ratio = contrastRatio(tokenValue(pair.fg), tokenValue(pair.bg));
    assert.ok(
      ratio >= pair.min,
      pair.name + ": " + ratio.toFixed(2) + ":1 (needs " + pair.min + ":1)"
    );
  }
});

test("focus indicators and borders meet non-text contrast", () => {
  for (const pair of UI_PAIRS) {
    const ratio = contrastRatio(tokenValue(pair.fg), tokenValue(pair.bg));
    assert.ok(ratio >= pair.min, pair.name + ": " + ratio.toFixed(2) + ":1 (needs " + pair.min + ":1)");
  }
});

test("focus outline is visible and offset in the stylesheet", () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid/, "a 2px solid focus outline is required");
  assert.match(css, /outline-offset:\s*2px/, "focus outline needs an offset so it never touches the text");
});

test("reduced-motion users get no forced transitions or reveals", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "reduced-motion block missing");
  assert.match(css, /animation-duration:\s*0\.01ms !important/, "animations must be neutralised");
  assert.match(css, /transition-duration:\s*0\.01ms !important/, "transitions must be neutralised");
  assert.match(css, /html \{ scroll-behavior: auto; \}/, "smooth scrolling must be disabled");
});
