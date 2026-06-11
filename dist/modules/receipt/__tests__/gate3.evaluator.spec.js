"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const gate3_evaluator_1 = require("../gate-engine/gate3.evaluator");
const d = (n) => new decimal_js_1.Decimal(n);
const LIMIT = d(5_000_000);
describe('Gate 3 — input guards', () => {
    test('throws on negative amount', () => {
        expect(() => (0, gate3_evaluator_1.evaluateGate3)(d(-1), LIMIT, true)).toThrow(RangeError);
    });
    test('throws on negative limit', () => {
        expect(() => (0, gate3_evaluator_1.evaluateGate3)(d(100_000), d(-1), true)).toThrow(RangeError);
    });
});
describe('Gate 3 — decision table', () => {
    it.each([
        [
            'Row 1: no bank account → not applicable, needs review',
            d(500_000), LIMIT, false,
            false, d(0), true,
        ],
        [
            'Row 2: zero amount, has bank account → no reimbursement',
            d(0), LIMIT, true,
            true, d(0), false,
        ],
        [
            'Row 3: zero policy limit → not applicable, needs review',
            d(500_000), d(0), true,
            false, d(0), true,
        ],
        [
            'Row 4: amount < limit → full reimbursement',
            d(1_000_000), LIMIT, true,
            true, d(1_000_000), false,
        ],
        [
            'Row 4b: amount = limit (boundary) → full reimbursement',
            d(5_000_000), LIMIT, true,
            true, d(5_000_000), false,
        ],
        [
            'Row 5a: amount = limit + 1 VND → capped, needs review',
            d(5_000_001), LIMIT, true,
            true, d(5_000_000), true,
        ],
        [
            'Row 5b: amount = 2× limit → capped, needs review',
            d(10_000_000), LIMIT, true,
            true, d(5_000_000), true,
        ],
        [
            'Row 6: 1 VND receipt, has bank account → reimbursed',
            d(1), LIMIT, true,
            true, d(1), false,
        ],
    ])('%s', (_, amount, limit, hasBankAccount, expApplicable, expDed, expNeedsReview) => {
        const r = (0, gate3_evaluator_1.evaluateGate3)(amount, limit, hasBankAccount);
        expect(r.applicable).toBe(expApplicable);
        expect(r.deductible.equals(expDed)).toBe(true);
        expect(r.needsReview).toBe(expNeedsReview);
    });
});
describe('Gate 3 — invariants', () => {
    test('deductible is always ≤ limit', () => {
        const cases = [d(1_000), d(5_000_000), d(10_000_000)];
        for (const amount of cases) {
            const r = (0, gate3_evaluator_1.evaluateGate3)(amount, LIMIT, true);
            expect(r.deductible.lte(LIMIT)).toBe(true);
        }
    });
    test('deductible is always ≤ amount', () => {
        const cases = [d(1_000), d(5_000_000), d(10_000_000)];
        for (const amount of cases) {
            const r = (0, gate3_evaluator_1.evaluateGate3)(amount, LIMIT, true);
            expect(r.deductible.lte(amount)).toBe(true);
        }
    });
    test('not applicable → deductible is zero', () => {
        const r = (0, gate3_evaluator_1.evaluateGate3)(d(500_000), LIMIT, false);
        expect(r.applicable).toBe(false);
        expect(r.deductible.isZero()).toBe(true);
    });
    test('needs review when amount exceeds limit', () => {
        const r = (0, gate3_evaluator_1.evaluateGate3)(d(6_000_000), LIMIT, true);
        expect(r.needsReview).toBe(true);
    });
    test('reason is always non-empty', () => {
        const cases = [
            [d(500_000), LIMIT, true],
            [d(500_000), LIMIT, false],
            [d(0), LIMIT, true],
        ];
        for (const args of cases) {
            const r = (0, gate3_evaluator_1.evaluateGate3)(...args);
            expect(r.reason.length).toBeGreaterThan(0);
        }
    });
});
describe('Gate 3 — bank account edge cases', () => {
    test('even large amounts are blocked without bank account', () => {
        const r = (0, gate3_evaluator_1.evaluateGate3)(d(100_000_000), LIMIT, false);
        expect(r.applicable).toBe(false);
        expect(r.deductible.isZero()).toBe(true);
    });
    test('zero amount with no bank account still needs review', () => {
        const r = (0, gate3_evaluator_1.evaluateGate3)(d(0), LIMIT, false);
        expect(r.applicable).toBe(false);
        expect(r.needsReview).toBe(true);
    });
});
//# sourceMappingURL=gate3.evaluator.spec.js.map