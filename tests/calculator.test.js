/* ==========================================================================
   calculator.test.js — unit tests for the ROI calculator logic (spec 8.7)
   Run: node --test tests/
   Expected values below are computed independently from the spec formulas,
   not read back from the implementation.
   ========================================================================== */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const calc = require("../script.js");

/* Independent re-implementation of the spec formulas (section 8.3). */
function expectedResult(input) {
  const weeklyHours = input.tasksPerWeek * input.minutesPerTask / 60;
  const monthlyHoursBefore = weeklyHours * (52 / 12);
  const monthlyHoursSaved = monthlyHoursBefore * (input.automationRate / 100);
  const grossMonthlyValue = monthlyHoursSaved * input.hourlyLaborCost;
  const netMonthlyEstimate = grossMonthlyValue - input.monthlyToolCost;
  const paybackMonths = netMonthlyEstimate > 0 ? input.setupCost / netMonthlyEstimate : null;
  return { monthlyHoursBefore, monthlyHoursSaved, grossMonthlyValue, netMonthlyEstimate, paybackMonths };
}

function calcFrom(raw) {
  const validation = calc.validateCalculatorInput(raw);
  assert.deepEqual(validation.errors, {}, "inputs should be valid: " + JSON.stringify(validation.errors));
  return calc.calculateRoi(validation.values);
}

function assertClose(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    message + " — expected ~" + expected + ", got " + actual
  );
}

const EPS = 1e-9;

test("1. default reference calculation (spec 8.6)", () => {
  const result = calcFrom(calc.CALC_DEFAULTS);
  assertClose(result.monthlyHoursBefore, 57.7778, 1e-3, "monthly hours before");
  assertClose(result.monthlyHoursSaved, 28.8889, 1e-3, "monthly hours saved");
  assertClose(result.grossMonthlyValue, 722.2222, 1e-3, "gross monthly value");
  assertClose(result.netMonthlyEstimate, 622.2222, 1e-3, "net monthly estimate");
  assertClose(result.paybackMonths, 0.8036, 1e-3, "payback months");
});

test("2. zero tasks per week yields zero savings and no payback", () => {
  const result = calcFrom({ ...calc.CALC_DEFAULTS, tasksPerWeek: 0 });
  assert.equal(result.monthlyHoursBefore, 0);
  assert.equal(result.grossMonthlyValue, 0);
  assert.equal(result.netMonthlyEstimate, -calc.CALC_DEFAULTS.monthlyToolCost);
  assert.equal(result.paybackMonths, null);
  assert.equal(result.paybackReason, "No positive payback under these assumptions.");
});

test("3. zero minutes per task yields zero savings", () => {
  const result = calcFrom({ ...calc.CALC_DEFAULTS, minutesPerTask: 0 });
  assert.equal(result.monthlyHoursBefore, 0);
  assert.equal(result.monthlyHoursSaved, 0);
  assert.equal(result.grossMonthlyValue, 0);
  assert.equal(result.paybackMonths, null);
});

test("4. zero automation rate saves nothing", () => {
  const result = calcFrom({ ...calc.CALC_DEFAULTS, automationRate: 0 });
  assert.equal(result.monthlyHoursSaved, 0);
  assert.equal(result.grossMonthlyValue, 0);
  assert.equal(result.netMonthlyEstimate, -100);
  assert.equal(result.paybackMonths, null);
});

test("5. zero hourly labor cost saves hours but no money", () => {
  const result = calcFrom({ ...calc.CALC_DEFAULTS, hourlyLaborCost: 0 });
  assert.ok(result.monthlyHoursSaved > 0, "hours are still saved");
  assert.equal(result.grossMonthlyValue, 0);
  assert.equal(result.netMonthlyEstimate, -100);
  assert.equal(result.paybackMonths, null);
});

test("6. zero monthly tools cost keeps full gross value", () => {
  const input = { ...calc.CALC_DEFAULTS, monthlyToolCost: 0 };
  const result = calcFrom(input);
  const expected = expectedResult(input);
  assertClose(result.netMonthlyEstimate, expected.grossMonthlyValue, EPS, "net equals gross");
  assertClose(result.paybackMonths, input.setupCost / expected.grossMonthlyValue, EPS, "payback");
});

test("7. zero setup cost pays back immediately without division errors", () => {
  const input = { ...calc.CALC_DEFAULTS, setupCost: 0 };
  const result = calcFrom(input);
  assert.equal(result.paybackMonths, 0);
  assert.equal(calc.formatPayback(result.paybackMonths), "0.0 months");
});

test("8. maximum allowed input values", () => {
  const input = {
    tasksPerWeek: 100000,
    minutesPerTask: 1440,
    automationRate: 100,
    hourlyLaborCost: 10000,
    monthlyToolCost: 1000000,
    setupCost: 10000000
  };
  const result = calcFrom(input);
  const expected = expectedResult(input);
  assertClose(result.monthlyHoursBefore, expected.monthlyHoursBefore, EPS, "hours before");
  assertClose(result.grossMonthlyValue, expected.grossMonthlyValue, EPS, "gross");
  assert.ok(Number.isFinite(result.paybackMonths), "payback is finite");
  for (const value of Object.values(result)) {
    assert.ok(typeof value !== "number" || Number.isFinite(value), "no non-finite value");
  }
});

test("9. minimum allowed input values (all zero)", () => {
  const input = {
    tasksPerWeek: 0, minutesPerTask: 0, automationRate: 0,
    hourlyLaborCost: 0, monthlyToolCost: 0, setupCost: 0
  };
  const result = calcFrom(input);
  assert.equal(result.monthlyHoursBefore, 0);
  assert.equal(result.netMonthlyEstimate, 0);
  assert.equal(result.paybackMonths, null, "net of zero has no payback");
  assert.equal(result.paybackReason, "No positive payback under these assumptions.");
});

test("10. invalid numeric input is rejected with field errors", () => {
  const cases = [
    { tasksPerWeek: "" },
    { tasksPerWeek: "abc" },
    { minutesPerTask: "12abc" },
    { automationRate: " " }
  ];
  for (const raw of cases) {
    const validation = calc.validateCalculatorInput({ ...calc.CALC_DEFAULTS, ...raw });
    const field = Object.keys(raw)[0];
    assert.equal(Object.keys(validation.errors).length, 1, "exactly one error for " + JSON.stringify(raw));
    assert.ok(validation.errors[field], "error reported for " + field);
    assert.ok(!(field in validation.values), "invalid field has no value");
  }
});

test("11. negative values are rejected", () => {
  for (const field of calc.CALC_FIELDS) {
    const validation = calc.validateCalculatorInput({ ...calc.CALC_DEFAULTS, [field]: -5 });
    assert.ok(validation.errors[field], field + " should reject -5");
    assert.ok(/or more/.test(validation.errors[field]), field + " error mentions the minimum");
  }
});

test("12. values above the maximum are rejected", () => {
  const over = {
    tasksPerWeek: 100001, minutesPerTask: 1441, automationRate: 101,
    hourlyLaborCost: 10001, monthlyToolCost: 1000001, setupCost: 10000001
  };
  for (const field of calc.CALC_FIELDS) {
    const validation = calc.validateCalculatorInput({ ...calc.CALC_DEFAULTS, [field]: over[field] });
    assert.ok(validation.errors[field], field + " should reject " + over[field]);
    assert.ok(/or less/.test(validation.errors[field]), field + " error mentions the maximum");
  }
});

test("13. non-finite values are rejected", () => {
  for (const field of calc.CALC_FIELDS) {
    for (const bad of [Infinity, -Infinity, "Infinity"]) {
      const validation = calc.validateCalculatorInput({ ...calc.CALC_DEFAULTS, [field]: bad });
      assert.ok(validation.errors[field], field + " should reject " + String(bad));
      assert.ok(/finite/.test(validation.errors[field]), field + " error mentions finiteness");
    }
  }
});

test("14. net monthly estimate equal to zero shows no payback", () => {
  // 10 tasks * 60 min = 10 h/week -> 43.333 h/month; 100% -> 43.333 h saved;
  // 43.333 h * $30 = $1,300 gross; tools $1,300 -> net exactly 0.
  const input = {
    tasksPerWeek: 10, minutesPerTask: 60, automationRate: 100,
    hourlyLaborCost: 30, monthlyToolCost: 1300, setupCost: 500
  };
  const result = calcFrom(input);
  assertClose(result.netMonthlyEstimate, 0, 1e-9, "net estimate");
  assert.equal(result.paybackMonths, null);
  assert.equal(result.paybackReason, "No positive payback under these assumptions.");
});

test("15. net monthly estimate below zero shows no payback", () => {
  const input = { ...calc.CALC_DEFAULTS, hourlyLaborCost: 1 }; // gross ~28.89, tools 100 -> net negative
  const result = calcFrom(input);
  assert.ok(result.netMonthlyEstimate < 0, "net is negative");
  assert.equal(result.paybackMonths, null);
});

test("16. reset semantics: defaults revalidate after arbitrary changes", () => {
  const messy = {
    tasksPerWeek: "-3", minutesPerTask: "99999", automationRate: "abc",
    hourlyLaborCost: "1e12", monthlyToolCost: "", setupCost: "  "
  };
  const broken = calc.validateCalculatorInput(messy);
  assert.equal(Object.keys(broken.errors).length, 6, "every messy field is rejected");

  const reset = calc.validateCalculatorInput(calc.CALC_DEFAULTS);
  assert.deepEqual(reset.errors, {});
  assert.deepEqual(reset.values, calc.CALC_DEFAULTS, "reset restores the six defaults");
  const result = calc.calculateRoi(reset.values);
  assertClose(result.paybackMonths, 0.8036, 1e-3, "post-reset payback matches the reference case");
});

test("17. recalculation after changing each input", () => {
  const base = calcFrom(calc.CALC_DEFAULTS);
  const expectations = {
    tasksPerWeek: 200,      // doubles every downstream figure
    minutesPerTask: 16,     // doubles every downstream figure
    automationRate: 25,     // halves the saved figures
    hourlyLaborCost: 50,    // doubles money figures
    monthlyToolCost: 50,    // raises net by 50
    setupCost: 1244.4445    // doubles payback (2 x 622.2222)
  };
  for (const [field, value] of Object.entries(expectations)) {
    const input = { ...calc.CALC_DEFAULTS, [field]: value };
    const result = calcFrom(input);
    const expected = expectedResult(input);
    assertClose(result.monthlyHoursSaved, expected.monthlyHoursSaved, EPS, field + " hours saved");
    assertClose(result.grossMonthlyValue, expected.grossMonthlyValue, EPS, field + " gross");
    assertClose(result.netMonthlyEstimate, expected.netMonthlyEstimate, EPS, field + " net");
    if (field === "setupCost") {
      assert.notEqual(result.paybackMonths, base.paybackMonths, field + " changes the payback");
    } else {
      assert.notEqual(result.netMonthlyEstimate, base.netMonthlyEstimate, field + " changes the result");
    }
  }
});

test("18. rounding and formatting are consistent", () => {
  const result = calcFrom(calc.CALC_DEFAULTS);
  assert.equal(calc.formatHours(result.monthlyHoursBefore), "57.8 h");
  assert.equal(calc.formatHours(result.monthlyHoursSaved), "28.9 h");
  assert.equal(calc.formatCurrency(result.grossMonthlyValue), "$722");
  assert.equal(calc.formatCurrency(result.netMonthlyEstimate), "$622");
  assert.equal(calc.formatCurrency(result.monthlyToolCost), "$100");
  assert.equal(calc.formatPayback(result.paybackMonths), "0.8 months");
  assert.equal(calc.formatHours(0), "0.0 h");
  assert.equal(calc.formatCurrency(-1500), "-$1,500");
});

test("19. no NaN or infinite values in formatted output across a matrix of inputs", () => {
  const matrix = [
    calc.CALC_DEFAULTS,
    { tasksPerWeek: 0, minutesPerTask: 0, automationRate: 0, hourlyLaborCost: 0, monthlyToolCost: 0, setupCost: 0 },
    { tasksPerWeek: 100000, minutesPerTask: 1440, automationRate: 100, hourlyLaborCost: 10000, monthlyToolCost: 1000000, setupCost: 10000000 },
    { tasksPerWeek: 100000, minutesPerTask: 1440, automationRate: 100, hourlyLaborCost: 10000, monthlyToolCost: 0, setupCost: 10000000 },
    { tasksPerWeek: 100000, minutesPerTask: 1, automationRate: 0.5, hourlyLaborCost: 0.01, monthlyToolCost: 999999, setupCost: 9999999 },
    { tasksPerWeek: 1, minutesPerTask: 0.001, automationRate: 0.001, hourlyLaborCost: 0.001, monthlyToolCost: 0.001, setupCost: 0.001 }
  ];
  for (const input of matrix) {
    const result = calc.calculateRoi(input);
    const rendered = [
      calc.formatHours(result.monthlyHoursBefore),
      calc.formatHours(result.monthlyHoursSaved),
      calc.formatCurrency(result.grossMonthlyValue),
      calc.formatCurrency(result.monthlyToolCost),
      calc.formatCurrency(result.netMonthlyEstimate),
      calc.formatPayback(result.paybackMonths)
    ];
    for (const text of rendered.slice(0, 5)) {
      assert.ok(text !== null && text !== undefined, "rendered value exists");
      assert.ok(!/NaN|Infinity|undefined/.test(text), "clean rendering, got: " + text);
    }
    if (result.paybackMonths !== null) {
      assert.ok(Number.isFinite(result.paybackMonths), "payback finite when present");
      assert.ok(result.paybackMonths >= 0, "payback never negative");
      assert.ok(!/NaN|Infinity|undefined/.test(rendered[5]), "clean payback rendering, got: " + rendered[5]);
    } else {
      assert.equal(rendered[5], null, "no payback rendered when net is not positive");
    }
  }
});

test("20. calculator source contains no network transmission", () => {
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "script.js"), "utf8");
  for (const pattern of [/fetch\s*\(/, /XMLHttpRequest/, /\.send\s*\(/, /navigator\.sendBeacon/, /localStorage/, /sessionStorage/, /WebSocket/]) {
    assert.ok(!pattern.test(source), "script.js must not contain " + pattern);
  }
});
