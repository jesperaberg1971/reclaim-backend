"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const gate2_evaluator_1 = require("../gate-engine/gate2.evaluator");
const d = (n) => new decimal_js_1.Decimal(n);
const MEAL_CAP = d(150_000);
const MONTHLY_CAP = d(3_000_000);
const ZERO_USED = d(0);
describe('Gate 2 — input guards', () => {
    test('negative amount throws', () => {
        expect(() => (0, gate2_evaluator_1.evaluateGate2)(d(-1), MEAL_CAP, MONTHLY_CAP, ZERO_USED)).toThrow(RangeError);
    });
    test('negative meal cap throws', () => {
        expect(() => (0, gate2_evaluator_1.evaluateGate2)(d(100_000), d(-1), MONTHLY_CAP, ZERO_USED)).toThrow(RangeError);
    });
    test('negative monthly cap throws', () => {
        expect(() => (0, gate2_evaluator_1.evaluateGate2)(d(100_000), MEAL_CAP, d(-1), ZERO_USED)).toThrow(RangeError);
    });
    test('negative welfare used throws', () => {
        expect(() => (0, gate2_evaluator_1.evaluateGate2)(d(100_000), MEAL_CAP, MONTHLY_CAP, d(-1))).toThrow(RangeError);
    });
});
describe('Gate 2 — zero amount', () => {
    test('zero amount → zero deductible, no PIT', () => {
        const r = (0, gate2_evaluator_1.evaluateGate2)(d(0), MEAL_CAP, MONTHLY_CAP, ZERO_USED);
        expect(r.deductible.isZero()).toBe(true);
        expect(r.pitFlag).toBe(false);
    });
});
describe('Gate 2 — decision table', () => {
    it.each([
        ['R1 - within meal cap and fresh budget',
            d(100_000), MEAL_CAP, MONTHLY_CAP, ZERO_USED,
            d(100_000), false],
        ['R2 - amount equals meal cap (boundary)',
            d(150_000), MEAL_CAP, MONTHLY_CAP, ZERO_USED,
            d(150_000), false],
        ['R3 - over meal cap but within monthly budget',
            d(200_000), MEAL_CAP, MONTHLY_CAP, ZERO_USED,
            d(150_000), true],
        ['R4 - monthly budget exhausted',
            d(100_000), MEAL_CAP, MONTHLY_CAP, MONTHLY_CAP,
            d(0), true],
        ['R5 - partial budget (50k remaining)',
            d(100_000), MEAL_CAP, d(2_950_000), d(2_900_000),
            d(50_000), true],
        ['R6 - amount exactly fills remaining budget',
            d(100_000), MEAL_CAP, d(2_900_000), d(2_800_000),
            d(100_000), false],
        ['R7 - zero monthly welfare cap',
            d(100_000), MEAL_CAP, d(0), ZERO_USED,
            d(0), true],
        ['R8 - zero meal cap (no per-receipt cap), fits in budget',
            d(200_000), d(0), MONTHLY_CAP, ZERO_USED,
            d(200_000), false],
        ['R9 - over meal cap AND partial budget (100k remaining)',
            d(200_000), MEAL_CAP, d(2_900_000), d(2_800_000),
            d(100_000), true],
        ['R10 - 1 VND receipt',
            d(1), MEAL_CAP, MONTHLY_CAP, ZERO_USED,
            d(1), false],
        ['R11 - 1 VND over meal cap',
            d(150_001), MEAL_CAP, MONTHLY_CAP, ZERO_USED,
            d(150_000), true],
    ])('%s', (_, amount, mealCap, monthlyCap, used, expDed, expPit) => {
        const r = (0, gate2_evaluator_1.evaluateGate2)(amount, mealCap, monthlyCap, used);
        expect(r.deductible.equals(expDed)).toBe(true);
        expect(r.pitFlag).toBe(expPit);
        expect(r.reason.length).toBeGreaterThan(0);
    });
});
describe('Gate 2 — invariants', () => {
    const amounts = [d(1), d(100_000), d(150_000), d(200_000), d(3_000_000)];
    const usedValues = [d(0), d(1_500_000), d(3_000_000)];
    test('deductible is never negative', () => {
        for (const amount of amounts) {
            for (const used of usedValues) {
                const r = (0, gate2_evaluator_1.evaluateGate2)(amount, MEAL_CAP, MONTHLY_CAP, used);
                expect(r.deductible.gte(0)).toBe(true);
            }
        }
    });
    test('deductible never exceeds monthly cap - used', () => {
        for (const amount of amounts) {
            for (const used of usedValues) {
                const r = (0, gate2_evaluator_1.evaluateGate2)(amount, MEAL_CAP, MONTHLY_CAP, used);
                const remaining = decimal_js_1.Decimal.max(d(0), MONTHLY_CAP.minus(used));
                expect(r.deductible.lte(remaining)).toBe(true);
            }
        }
    });
    test('deductible never exceeds amount', () => {
        for (const amount of amounts) {
            const r = (0, gate2_evaluator_1.evaluateGate2)(amount, MEAL_CAP, MONTHLY_CAP, ZERO_USED);
            expect(r.deductible.lte(amount)).toBe(true);
        }
    });
    test('pitFlag is true whenever deductible < amount', () => {
        for (const amount of amounts) {
            const r = (0, gate2_evaluator_1.evaluateGate2)(amount, MEAL_CAP, MONTHLY_CAP, ZERO_USED);
            if (r.deductible.lt(amount)) {
                expect(r.pitFlag).toBe(true);
            }
        }
    });
    test('pitFlag is false when deductible = amount (no excess)', () => {
        const r = (0, gate2_evaluator_1.evaluateGate2)(d(100_000), MEAL_CAP, MONTHLY_CAP, ZERO_USED);
        expect(r.deductible.equals(d(100_000))).toBe(true);
        expect(r.pitFlag).toBe(false);
    });
});
describe('Gate 2 — Gate 1 overflow scenarios', () => {
    test('50k overflow fits in fresh budget → full deductible', () => {
        const r = (0, gate2_evaluator_1.evaluateGate2)(d(50_000), MEAL_CAP, MONTHLY_CAP, ZERO_USED);
        expect(r.deductible.equals(d(50_000))).toBe(true);
        expect(r.pitFlag).toBe(false);
    });
    test('200k overflow, budget nearly exhausted → partial', () => {
        const used = d(2_950_000);
        const r = (0, gate2_evaluator_1.evaluateGate2)(d(200_000), MEAL_CAP, MONTHLY_CAP, used);
        expect(r.deductible.equals(d(50_000))).toBe(true);
        expect(r.pitFlag).toBe(true);
    });
});
//# sourceMappingURL=gate2.evaluator.spec.js.map