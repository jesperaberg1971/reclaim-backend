"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const gate1_evaluator_1 = require("../gate-engine/gate1.evaluator");
const d = (n) => new decimal_js_1.Decimal(n);
const trip = (overrides = {}) => ({
    id: 'trip-1',
    status: 'approved',
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-06-05'),
    daily_allowance_amount: d(700_000),
    ...overrides,
});
const midTrip = new Date('2026-06-03');
describe('Gate 1 — no trip / non-approved', () => {
    test('no trip decision → not applicable', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, null);
        expect(r.applicable).toBe(false);
        expect(r.deductible.isZero()).toBe(true);
    });
    test('pending trip → not applicable', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, trip({ status: 'pending' }));
        expect(r.applicable).toBe(false);
    });
    test('cancelled trip → not applicable', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, trip({ status: 'cancelled' }));
        expect(r.applicable).toBe(false);
    });
});
describe('Gate 1 — date boundaries', () => {
    it.each([
        ['exactly on start_date', new Date('2026-06-01'), true],
        ['exactly on end_date', new Date('2026-06-05'), true],
        ['one day before start', new Date('2026-05-31'), false],
        ['one day after end', new Date('2026-06-06'), false],
        ['inside range', new Date('2026-06-03'), true],
    ])('%s', (_, date, expApplicable) => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), date, trip());
        expect(r.applicable).toBe(expApplicable);
    });
});
describe('Gate 1 — decision table (daily allowance = 700 000 VND)', () => {
    const ALLOWANCE = d(700_000);
    it.each([
        ['amount < allowance → full deduction, no overflow',
            d(300_000), d(300_000), d(0)],
        ['amount = allowance (boundary) → full deduction, no overflow',
            d(700_000), d(700_000), d(0)],
        ['amount = allowance + 1 VND → allowance deducted, 1 VND overflow',
            d(700_001), d(700_000), d(1)],
        ['amount = 2× allowance → allowance deducted, allowance overflow',
            d(1_400_000), d(700_000), d(700_000)],
        ['large receipt → only allowance deducted',
            d(5_000_000), d(700_000), d(4_300_000)],
    ])('%s', (_, amount, expDed, expOverflow) => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(amount, midTrip, trip());
        expect(r.applicable).toBe(true);
        expect(r.deductible.equals(expDed)).toBe(true);
        expect(r.overflow.equals(expOverflow)).toBe(true);
    });
});
describe('Gate 1 — Ticket-5 DoD: 500 000 VND receipt, 300 000 VND cap', () => {
    const CAP_300K = trip({ daily_allowance_amount: d(300_000) });
    test('parent portion is 300 000 VND (gate_applied = 1)', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, CAP_300K);
        expect(r.applicable).toBe(true);
        expect(r.deductible.equals(d(300_000))).toBe(true);
    });
    test('overflow (child) portion is 200 000 VND', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, CAP_300K);
        expect(r.overflow.equals(d(200_000))).toBe(true);
    });
    test('deductible + overflow exactly equals the original amount', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, CAP_300K);
        expect(r.deductible.plus(r.overflow).equals(d(500_000))).toBe(true);
    });
    test('no PIT implied at evaluator level (per-diem is tax-exempt)', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, CAP_300K);
        expect(r.applicable).toBe(true);
        expect(r.overflow.gt(0)).toBe(true);
    });
});
describe('Gate 1 — zero amount', () => {
    test('zero amount with approved trip → applicable, zero deductible, zero overflow', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(0), midTrip, trip());
        expect(r.applicable).toBe(true);
        expect(r.deductible.isZero()).toBe(true);
        expect(r.overflow.isZero()).toBe(true);
    });
});
describe('Gate 1 — invariants', () => {
    const amounts = [d(1), d(700_000), d(1_500_000), d(10_000_000)];
    test('deductible + overflow = amount when applicable', () => {
        for (const amount of amounts) {
            const r = (0, gate1_evaluator_1.evaluateGate1)(amount, midTrip, trip());
            if (r.applicable) {
                expect(r.deductible.plus(r.overflow).equals(amount)).toBe(true);
            }
        }
    });
    test('deductible never exceeds daily allowance', () => {
        for (const amount of amounts) {
            const r = (0, gate1_evaluator_1.evaluateGate1)(amount, midTrip, trip());
            expect(r.deductible.lte(trip().daily_allowance_amount)).toBe(true);
        }
    });
    test('overflow is zero when amount ≤ allowance', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(600_000), midTrip, trip());
        expect(r.overflow.isZero()).toBe(true);
    });
    test('reason is always non-empty', () => {
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, trip());
        expect(r.reason.length).toBeGreaterThan(0);
    });
});
describe('Gate 1 — trip with zero daily allowance', () => {
    test('any amount → deductible = 0, overflow = full amount', () => {
        const zeroTrip = trip({ daily_allowance_amount: d(0) });
        const r = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), midTrip, zeroTrip);
        expect(r.applicable).toBe(true);
        expect(r.deductible.isZero()).toBe(true);
        expect(r.overflow.equals(d(500_000))).toBe(true);
    });
});
//# sourceMappingURL=gate1.evaluator.spec.js.map