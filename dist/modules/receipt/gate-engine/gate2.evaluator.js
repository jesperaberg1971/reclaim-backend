"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGate2 = evaluateGate2;
const decimal_js_1 = require("decimal.js");
const ZERO = new decimal_js_1.Decimal(0);
function evaluateGate2(amount, mealCapVnd, welfareMonthlyCapVnd, welfareUsedThisMonth) {
    if (amount.lt(ZERO))
        throw new RangeError('amount must be ≥ 0');
    if (mealCapVnd.lt(ZERO))
        throw new RangeError('mealCapVnd must be ≥ 0');
    if (welfareMonthlyCapVnd.lt(ZERO))
        throw new RangeError('welfareMonthlyCapVnd must be ≥ 0');
    if (welfareUsedThisMonth.lt(ZERO))
        throw new RangeError('welfareUsedThisMonth must be ≥ 0');
    if (amount.isZero()) {
        return { deductible: ZERO, pitFlag: false, reason: 'Zero-amount receipt' };
    }
    const capApplied = mealCapVnd.isZero() ? amount : decimal_js_1.Decimal.min(amount, mealCapVnd);
    const aboveMealCap = amount.minus(capApplied);
    const welfareRemaining = decimal_js_1.Decimal.max(ZERO, welfareMonthlyCapVnd.minus(welfareUsedThisMonth));
    if (welfareRemaining.isZero()) {
        return {
            deductible: ZERO,
            pitFlag: true,
            reason: 'Monthly welfare cap exhausted — full amount is taxable benefit-in-kind',
        };
    }
    if (capApplied.lte(welfareRemaining)) {
        const pitFlag = aboveMealCap.gt(ZERO);
        const reason = pitFlag
            ? `Meal cap ${mealCapVnd} VND applied; ${aboveMealCap} VND above cap is taxable`
            : `Within meal cap and welfare budget`;
        return { deductible: capApplied, pitFlag, reason };
    }
    return {
        deductible: welfareRemaining,
        pitFlag: true,
        reason: `Partial welfare: ${welfareRemaining} VND deductible; remaining ${capApplied.minus(welfareRemaining).plus(aboveMealCap)} VND taxable`,
    };
}
//# sourceMappingURL=gate2.evaluator.js.map