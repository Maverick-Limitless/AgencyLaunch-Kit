/* ==========================================================================
   browser-checks.js — browser verification with Playwright (spec 15.3, 9, 10)
   Optional test: needs Playwright, which is NOT a product dependency.

   From a directory that has Playwright installed (see docs/TESTING.md):
     NODE_PATH=/path/to/dev/node_modules node tests/browser-checks.js
   or from the project root after `npm install --no-save playwright`:
     node tests/browser-checks.js

   If Playwright cannot be resolved, these checks are skipped with
   instructions rather than silently passing.
   ========================================================================== */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

let playwright = null;
try {
  playwright = require("playwright");
} catch (error) {
  playwright = null;
}

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".md": "text/markdown", ".txt": "text/plain"
};

function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const urlPath = decodeURIComponent(request.url.split("?")[0]);
      const filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404); response.end("not found"); return;
      }
      response.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
      response.end(fs.readFileSync(filePath));
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, baseUrl: "http://127.0.0.1:" + server.address().port });
    });
  });
}

if (!playwright) {
  test("browser checks", (t) => {
    t.skip("Playwright not resolvable — install it in a dev directory and run: " +
           "NODE_PATH=<dev>/node_modules node tests/browser-checks.js (see docs/TESTING.md)");
  });
} else {
  let browser;
  let baseUrl;
  let server;

  /* ALK_BROWSER=chromium|firefox|webkit selects the engine (default chromium). */
  const browserName = process.env.ALK_BROWSER || "chromium";
  if (!playwright[browserName]) {
    throw new Error("Unknown browser: " + browserName + " (available: chromium, firefox, webkit)");
  }

  /* Playwright's WebKit build does not emulate sequential Tab focus in DOM
     order (reproduced on a page with no styles or scripts at all: Tab
     oscillates between the body and the first input). On that engine the
     focus-based checks focus the control directly after one Tab press,
     which keeps keyboard modality for :focus-visible. Documented in
     docs/TESTING.md. Chromium and Firefox use real Tab navigation. */
  const supportsSequentialTab = browserName !== "webkit";

  test.before(async () => {
    server = await createServer();
    baseUrl = server.baseUrl;
    browser = await playwright[browserName].launch();
  });

  test.after(async () => {
    if (browser) { await browser.close(); }
    if (server) { server.server.close(); }
  });

  async function newPage(viewport) {
    const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 900 } });
    const requests = [];
    const consoleErrors = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => { if (message.type() === "error") { consoleErrors.push(message.text()); } });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));
    await page.goto(baseUrl + "/", { waitUntil: "load" });
    return { page, requests, consoleErrors };
  }

  /* ---------- page load ---------- */

  test("page loads with no console or page errors", async () => {
    const { page, consoleErrors } = await newPage();
    assert.match(await page.title(), /AgencyLaunch Kit/);
    assert.deepEqual(consoleErrors, [], "console errors: " + consoleErrors.join(" | "));
    await page.close();
  });

  test("all requests stay on the local server; none after interaction", async () => {
    const { page, requests } = await newPage();
    const before = requests.length;
    await page.fill("#calc-tasks", "250");
    await page.fill("#calc-minutes", "12");
    await page.click("#calc-reset");
    await page.locator(".faq__question").first().click();
    assert.equal(requests.length, before, "interactions must not trigger requests");
    for (const url of requests) {
      assert.ok(url.startsWith(baseUrl), "external request: " + url);
    }
    await page.close();
  });

  test("no browser storage is written during calculator use", async () => {
    const { page } = await newPage();
    await page.fill("#calc-tasks", "321");
    const storage = await page.evaluate(() => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length
    }));
    assert.equal(storage.local, 0, "localStorage must stay empty");
    assert.equal(storage.session, 0, "sessionStorage must stay empty");
    await page.close();
  });

  /* ---------- calculator DOM behaviour ---------- */

  test("calculator renders the default reference results on load", async () => {
    const { page } = await newPage();
    await expectText(page, "#result-hours-before", "57.8 h");
    await expectText(page, "#result-hours-saved", "28.9 h");
    await expectText(page, "#result-gross", "$722");
    await expectText(page, "#result-tools", "$100");
    await expectText(page, "#result-net", "$622");
    await expectText(page, "#result-payback", "0.8 months");
    await page.close();
  });

  test("invalid input shows a field error and stops rendering numbers", async () => {
    const { page } = await newPage();
    await page.fill("#calc-tasks", "500000");
    await waitForText(page, "#calc-tasks-error", /or less/);
    assert.equal(await page.getAttribute("#calc-tasks", "aria-invalid"), "true");
    await expectText(page, "#result-net", "—");
    assert.notEqual(await page.textContent("#calc-status"), "");
    await page.close();
  });

  test("negative input is rejected with an explanation", async () => {
    const { page } = await newPage();
    await page.fill("#calc-labor", "-25");
    await waitForText(page, "#calc-labor-error", /or more/);
    await expectText(page, "#result-net", "—");
    await page.close();
  });

  test("reset restores all six defaults and their results", async () => {
    const { page } = await newPage();
    await page.fill("#calc-tasks", "800");
    await page.fill("#calc-setup", "5000");
    await waitForText(page, "#result-net", "$5,678");
    await page.click("#calc-reset");
    for (const [id, value] of [["#calc-tasks", "100"], ["#calc-minutes", "8"], ["#calc-rate", "50"], ["#calc-labor", "25"], ["#calc-tools", "100"], ["#calc-setup", "500"]]) {
      assert.equal(await page.inputValue(id), value, id + " not reset");
    }
    await waitForText(page, "#result-net", "$622");
    await waitForText(page, "#result-payback", "0.8 months");
    await page.close();
  });

  test("net at or below zero shows the no-payback message", async () => {
    const { page } = await newPage();
    await page.fill("#calc-tools", "100000");
    await waitForText(page, "#result-net", "-$99,278");
    await expectText(page, "#result-payback", "No positive payback under these assumptions.");
    await page.close();
  });

  test("results update as each input changes", async () => {
    const { page } = await newPage();
    await page.fill("#calc-rate", "100");
    await waitForText(page, "#result-hours-saved", "57.8 h");
    await expectText(page, "#result-net", "$1,344");
    await page.fill("#calc-rate", "50");
    await waitForText(page, "#result-net", "$622");
    await page.close();
  });

  /* ---------- helpers ---------- */

  async function expectText(page, selector, expected) {
    const actual = (await page.textContent(selector)).trim();
    if (expected instanceof RegExp) {
      assert.match(actual, expected, selector + " -> " + actual);
    } else {
      assert.equal(actual, expected, selector + " -> " + actual);
    }
  }

  /* Wait for a result to settle after an interaction (the reset handler
     re-renders on the next task), then assert. */
  async function waitForText(page, selector, expected) {
    const needle = (expected instanceof RegExp ? expected.source : expected)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await page.waitForFunction(
      ([sel, re]) => new RegExp(re).test(document.querySelector(sel).textContent.trim()),
      [selector, needle],
      { timeout: 5000 }
    );
    await expectText(page, selector, expected);
  }
  /* ---------- navigation ---------- */

  test("desktop navigation exposes every section link", async () => {
    const { page } = await newPage();
    const links = await page.locator("#primary-nav .primary-nav__list a").allTextContents();
    assert.ok(links.length >= 6, "primary links present, got " + links.length);
    await expectText(page, "#primary-nav .nav-cta", "Book a workflow audit");
    assert.equal(await page.locator(".nav-toggle").isVisible(), false, "toggle hidden on desktop");
    await page.close();
  });

  test("mobile menu opens, exposes state, and closes with Escape", async () => {
    const { page } = await newPage({ width: 375, height: 720 });
    const toggle = page.locator(".nav-toggle");
    assert.equal(await toggle.isVisible(), true, "toggle visible on mobile");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator("#primary-nav").isVisible(), false, "menu starts closed");

    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true", "expanded state exposed");
    assert.equal(await toggle.getAttribute("aria-label"), "Close menu");
    assert.equal(await page.locator("#primary-nav").isVisible(), true, "menu opens");

    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false", "Escape closes the menu");
    assert.equal(await page.locator("#primary-nav").isVisible(), false, "menu hidden after Escape");
    await page.close();
  });

  test("mobile menu opens with the keyboard and closes on link activation", async () => {
    const { page } = await newPage({ width: 375, height: 720 });
    if (supportsSequentialTab) {
      await page.keyboard.press("Tab"); // skip link
      await page.keyboard.press("Tab"); // brand
      await page.keyboard.press("Tab"); // toggle
    } else {
      await page.keyboard.press("Tab"); // establish keyboard modality only
      await page.evaluate(() => document.querySelector(".nav-toggle").focus());
    }
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.className), "nav-toggle", "toggle is reachable by keyboard");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".nav-toggle").getAttribute("aria-expanded"), "true", "Enter opens the menu");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim()), "Use cases", "focus moves into the open menu");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".nav-toggle").getAttribute("aria-expanded"), "false", "activating a link closes the menu");
    await page.close();
  });

  /* ---------- skip link and focus ---------- */

  test("skip link becomes visible on keyboard focus", async () => {
    const { page } = await newPage();
    await page.keyboard.press("Tab");
    if (!supportsSequentialTab) {
      // WebKit: Tab order is emulated unreliably in this environment; focus
      // the control directly (keyboard modality is already established).
      await page.evaluate(() => document.querySelector(".skip-link").focus());
    }
    await page.waitForTimeout(300); // let the slide-in transition settle
    const state = await page.evaluate(() => {
      const active = document.activeElement;
      const style = getComputedStyle(active);
      return {
        className: active.className,
        href: active.getAttribute("href"),
        top: parseFloat(style.top),
        outlineWidth: style.outlineWidth
      };
    });
    assert.equal(state.className, "skip-link");
    assert.equal(state.href, "#main");
    assert.ok(state.top >= 0, "skip link is on screen when focused");
    assert.notEqual(state.outlineWidth, "0px", "focused skip link shows an outline");
    await page.close();
  });

  test("keyboard focus produces a visible outline", async () => {
    const { page } = await newPage();
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });
    assert.ok(parseFloat(outline.width) >= 2, "outline width at least 2px, got " + outline.width);
    assert.notEqual(outline.style, "none");
    await page.close();
  });

  /* ---------- FAQ ---------- */

  test("FAQ disclosures open and close by keyboard", async () => {
    const { page } = await newPage();
    const question = page.locator(".faq__question").first();
    await question.focus();
    assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.querySelector(".faq__item").open), true, "Enter opens the disclosure");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.querySelector(".faq__item").open), false, "Enter closes it again");
    await question.click();
    assert.equal(await page.evaluate(() => document.querySelector(".faq__item").open), true, "click opens as well");
    await page.close();
  });

  /* ---------- responsive ---------- */

  for (const width of [320, 375, 768, 1024, 1440]) {
    test("no horizontal overflow at " + width + "px", async () => {
      const { page } = await newPage({ width, height: 900 });
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      assert.ok(
        overflow.scrollWidth <= overflow.clientWidth + 1,
        "content is wider than the viewport: " + JSON.stringify(overflow)
      );
      await page.close();
    });
  }

  test("calculator stays usable at 320px", async () => {
    const { page } = await newPage({ width: 320, height: 720 });
    await expectText(page, "#result-net", "$622");
    const box = await page.locator("#calc-reset").boundingBox();
    assert.ok(box.width >= 24 && box.height >= 24, "reset button is large enough to tap");
    await page.close();
  });

  /* ---------- accessibility structure ---------- */

  test("landmarks and roles are present with accessible names", async () => {
    const { page } = await newPage();
    const structure = await page.evaluate(() => ({
      header: !!document.querySelector("header"),
      main: !!document.querySelector("main#main"),
      footer: !!document.querySelector("footer"),
      navs: Array.from(document.querySelectorAll("nav")).map((nav) => nav.getAttribute("aria-label")),
      h1: document.querySelectorAll("h1").length,
      h2: document.querySelectorAll("h2").length,
      lang: document.documentElement.lang
    }));
    assert.ok(structure.header && structure.main && structure.footer, "landmarks present");
    assert.deepEqual(structure.navs.sort(), ["Footer", "Primary"]);
    assert.equal(structure.h1, 1);
    assert.ok(structure.h2 >= 8, "section headings present");
    assert.equal(structure.lang, "en");
    await page.close();
  });

  test("every calculator input exposes an accessible name and description", async () => {
    const { page } = await newPage();
    const fields = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#roi-form input")).map((input) => ({
        id: input.id,
        labelled: !!document.querySelector('label[for="' + input.id + '"]'),
        described: (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean),
        type: input.type,
        min: input.getAttribute("min"),
        max: input.getAttribute("max")
      }))
    );
    assert.equal(fields.length, 6);
    for (const field of fields) {
      assert.ok(field.labelled, field.id + " has a label");
      assert.ok(field.described.length === 2, field.id + " references hint and error");
      assert.equal(field.type, "number");
      assert.ok(field.min === "0", field.id + " declares min");
      assert.ok(field.max, field.id + " declares max");
    }
    await page.close();
  });

  test("contact and email links are real mailto links", async () => {
    const { page } = await newPage();
    const mailtos = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.getAttribute("href"))
    );
    assert.ok(mailtos.length >= 2, "contact section and footer link the address");
    for (const href of mailtos) {
      assert.equal(href, "mailto:hello@example.com");
    }
    await page.close();
  });
}
