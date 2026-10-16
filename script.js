/* ==========================================================================
   AgencyLaunch Kit — interactions
   Pure calculator logic first (no DOM), browser wiring after.
   Loaded with `defer`; safe to import in Node for tests.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     ROI calculator — pure logic (spec section 8)
     ------------------------------------------------------------------ */

  var CALC_FIELDS = ["tasksPerWeek", "minutesPerTask", "automationRate", "hourlyLaborCost", "monthlyToolCost", "setupCost"];

  var CALC_DEFAULTS = {
    tasksPerWeek: 100,
    minutesPerTask: 8,
    automationRate: 50,
    hourlyLaborCost: 25,
    monthlyToolCost: 100,
    setupCost: 500
  };

  var CALC_LIMITS = {
    tasksPerWeek: { min: 0, max: 100000 },
    minutesPerTask: { min: 0, max: 1440 },
    automationRate: { min: 0, max: 100 },
    hourlyLaborCost: { min: 0, max: 10000 },
    monthlyToolCost: { min: 0, max: 1000000 },
    setupCost: { min: 0, max: 10000000 }
  };

  var CALC_LABELS = {
    tasksPerWeek: "Tasks per week",
    minutesPerTask: "Minutes per task",
    automationRate: "Automation rate",
    hourlyLaborCost: "Loaded labor cost per hour",
    monthlyToolCost: "Monthly tools and maintenance",
    setupCost: "One-time setup cost"
  };

  function formatLimit(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /**
   * Validate raw input (strings from the DOM, or numbers from tests).
   * Returns { values, errors } — values are finite numbers in range,
   * errors maps field name -> human message. Never throws.
   */
  function validateCalculatorInput(raw) {
    var values = {};
    var errors = {};
    var input = raw || {};

    CALC_FIELDS.forEach(function (field) {
      var limits = CALC_LIMITS[field];
      var label = CALC_LABELS[field];
      var value = input[field];
      var message = null;

      if (typeof value === "string") {
        value = value.trim();
        if (value === "") {
          message = label + ": enter a number.";
        }
      }

      var parsed = null;
      if (message === null) {
        parsed = typeof value === "number" ? value : Number(value);
        if (!isFinite(parsed)) {
          message = label + ": enter a finite number.";
        } else if (parsed < limits.min) {
          message = label + ": enter " + formatLimit(limits.min) + " or more.";
        } else if (parsed > limits.max) {
          message = label + ": enter " + formatLimit(limits.max) + " or less.";
        }
      }

      if (message === null) {
        values[field] = parsed;
      } else {
        errors[field] = message;
      }
    });

    return { values: values, errors: errors };
  }

  /**
   * Compute the estimate from validated numbers. Keeps full precision;
   * presentation formats separately. Payback is null when not meaningful.
   */
  function calculateRoi(input) {
    var tasksPerWeek = input.tasksPerWeek;
    var minutesPerTask = input.minutesPerTask;
    var automationRate = input.automationRate;
    var hourlyLaborCost = input.hourlyLaborCost;
    var monthlyToolCost = input.monthlyToolCost;
    var setupCost = input.setupCost;

    var weeklyHours = tasksPerWeek * minutesPerTask / 60;
    var monthlyHoursBefore = weeklyHours * (52 / 12);
    var monthlyHoursSaved = monthlyHoursBefore * (automationRate / 100);
    var grossMonthlyValue = monthlyHoursSaved * hourlyLaborCost;
    var netMonthlyEstimate = grossMonthlyValue - monthlyToolCost;

    var paybackMonths = null;
    var paybackReason = null;
    if (netMonthlyEstimate > 0) {
      paybackMonths = setupCost / netMonthlyEstimate; // 0 setup -> 0, never a division error
    } else if (netMonthlyEstimate === 0) {
      paybackReason = "No positive payback under these assumptions.";
    } else {
      paybackReason = "No positive payback under these assumptions.";
    }

    return {
      weeklyHours: weeklyHours,
      monthlyHoursBefore: monthlyHoursBefore,
      monthlyHoursSaved: monthlyHoursSaved,
      grossMonthlyValue: grossMonthlyValue,
      monthlyToolCost: monthlyToolCost,
      netMonthlyEstimate: netMonthlyEstimate,
      paybackMonths: paybackMonths,
      paybackReason: paybackReason
    };
  }

  function formatNumber(value, minDigits, maxDigits) {
    if (typeof value !== "number" || !isFinite(value)) { return "—"; }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits
    }).format(value);
  }

  function formatHours(value) {
    var formatted = formatNumber(value, 1, 1);
    return formatted === "—" ? formatted : formatted + " h";
  }

  function formatCurrency(value) {
    if (typeof value !== "number" || !isFinite(value)) { return "—"; }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  function formatPayback(months) {
    if (months === null || typeof months !== "number" || !isFinite(months)) { return null; }
    return formatNumber(months, 1, 1) + " months";
  }

  /* Node export for the test suite; browsers ignore this block. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      CALC_FIELDS: CALC_FIELDS,
      CALC_DEFAULTS: CALC_DEFAULTS,
      CALC_LIMITS: CALC_LIMITS,
      CALC_LABELS: CALC_LABELS,
      validateCalculatorInput: validateCalculatorInput,
      calculateRoi: calculateRoi,
      formatNumber: formatNumber,
      formatHours: formatHours,
      formatCurrency: formatCurrency,
      formatPayback: formatPayback
    };
  }

  /* ------------------------------------------------------------------
     Browser wiring below. Skipped under Node so tests can import.
     ------------------------------------------------------------------ */
  if (typeof document === "undefined") { return; }

  document.documentElement.classList.add("js");
  /* ---- Mobile navigation ---- */

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var primaryNav = document.getElementById("primary-nav");
  var desktopQuery = window.matchMedia("(min-width: 861px)");

  function menuIsOpen() {
    return navToggle.getAttribute("aria-expanded") === "true";
  }

  function setMenu(open) {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    primaryNav.hidden = !open;
  }

  function firstNavLink() {
    return primaryNav.querySelector("a");
  }

  function openMenu() {
    setMenu(true);
    if (document.activeElement === navToggle) {
      var link = firstNavLink();
      if (link) { link.focus(); }
    }
  }

  function closeMenu(returnFocus) {
    var wasOpen = menuIsOpen();
    setMenu(false);
    if (wasOpen && returnFocus && primaryNav.contains(document.activeElement)) {
      navToggle.focus();
    }
  }

  function syncMenuWithViewport() {
    if (desktopQuery.matches) {
      primaryNav.hidden = false;
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    } else if (!menuIsOpen()) {
      primaryNav.hidden = true;
    }
  }

  if (navToggle && primaryNav) {
    syncMenuWithViewport();

    navToggle.addEventListener("click", function () {
      if (menuIsOpen()) { closeMenu(true); } else { openMenu(); }
    });

    primaryNav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link && !desktopQuery.matches) { closeMenu(false); }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuIsOpen() && !desktopQuery.matches) {
        closeMenu(true);
      }
    });

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", syncMenuWithViewport);
    }
  }

  /* ---- Header shadow after scroll ---- */

  function syncHeaderScrolled() {
    if (header) { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  }
  window.addEventListener("scroll", syncHeaderScrolled, { passive: true });
  syncHeaderScrolled();

  /* ---- Footer year ---- */

  var footerYear = document.getElementById("footer-year");
  if (footerYear) { footerYear.textContent = String(new Date().getFullYear()); }

  /* ---- ROI calculator wiring ---- */

  var NO_PAYBACK_MESSAGE = "No positive payback under these assumptions.";

  var calcForm = document.getElementById("roi-form");
  var calcStatus = document.getElementById("calc-status");
  var calcFieldIds = {
    tasksPerWeek: "calc-tasks",
    minutesPerTask: "calc-minutes",
    automationRate: "calc-rate",
    hourlyLaborCost: "calc-labor",
    monthlyToolCost: "calc-tools",
    setupCost: "calc-setup"
  };
  var calcResultIds = {
    monthlyHoursBefore: "result-hours-before",
    monthlyHoursSaved: "result-hours-saved",
    grossMonthlyValue: "result-gross",
    monthlyToolCost: "result-tools",
    netMonthlyEstimate: "result-net",
    payback: "result-payback"
  };

  function calcInputs() {
    var inputs = {};
    CALC_FIELDS.forEach(function (field) {
      inputs[field] = document.getElementById(calcFieldIds[field]);
    });
    return inputs;
  }

  function setFieldError(input, message) {
    var errorElement = document.getElementById(input.id + "-error");
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
      }
    } else {
      input.setAttribute("aria-invalid", "false");
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.hidden = true;
      }
    }
  }

  function setResult(id, text) {
    var element = document.getElementById(calcResultIds[id]);
    if (element) { element.textContent = text; }
  }

  function renderCalculator() {
    if (!calcForm) { return; }

    var inputs = calcInputs();
    var raw = {};
    CALC_FIELDS.forEach(function (field) {
      raw[field] = inputs[field] ? inputs[field].value : "";
    });

    var validation = validateCalculatorInput(raw);

    CALC_FIELDS.forEach(function (field) {
      setFieldError(inputs[field], validation.errors[field] || null);
    });

    var errorFields = Object.keys(validation.errors);

    if (errorFields.length > 0) {
      calcStatus.textContent = validation.errors[errorFields[0]];
      setResult("monthlyHoursBefore", "—");
      setResult("monthlyHoursSaved", "—");
      setResult("grossMonthlyValue", "—");
      setResult("monthlyToolCost", "—");
      setResult("netMonthlyEstimate", "—");
      setResult("payback", "—");
      return;
    }

    calcStatus.textContent = "";

    var result = calculateRoi(validation.values);

    setResult("monthlyHoursBefore", formatHours(result.monthlyHoursBefore));
    setResult("monthlyHoursSaved", formatHours(result.monthlyHoursSaved));
    setResult("grossMonthlyValue", formatCurrency(result.grossMonthlyValue));
    setResult("monthlyToolCost", formatCurrency(result.monthlyToolCost));
    setResult("netMonthlyEstimate", formatCurrency(result.netMonthlyEstimate));

    var paybackText = formatPayback(result.paybackMonths);
    setResult("payback", paybackText === null ? (result.paybackReason || NO_PAYBACK_MESSAGE) : paybackText);
  }

  if (calcForm) {
    calcForm.addEventListener("input", renderCalculator);
    calcForm.addEventListener("change", renderCalculator);

    /* Native reset restores field values after the event, so re-render once
       the browser has applied it. */
    calcForm.addEventListener("reset", function () {
      window.setTimeout(renderCalculator, 0);
    });

    renderCalculator();
  }
})();
