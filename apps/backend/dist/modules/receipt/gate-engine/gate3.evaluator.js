"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGate3 = evaluateGate3;
const decimal_js_1 = require("decimal.js");
const ZERO = new decimal_js_1.Decimal(0);
function evaluateGate3(amount, personalCardLimitVnd, hasBankAccount) {
    if (amount.lt(ZERO))
        throw new RangeError('amount must be ≥ 0');
    if (personalCardLimitVnd.lt(ZERO))
        throw new RangeError('personalCardLimitVnd must be ≥ 0');
    if (!hasBankAccount) {
        return {
            applicable: false,
            deductible: ZERO,
            needsReview: true,
            reason: 'No verified bank account on file — reimbursement requires manual processing',
        };
    }
    if (amount.isZero()) {
        return {
            applicable: true,
            deductible: ZERO,
            needsReview: false,
            reason: 'Zero-amount receipt — no reimbursement needed',
        };
    }
    if (personalCardLimitVnd.isZero()) {
        return {
            applicable: false,
            deductible: ZERO,
            needsReview: true,
            reason: 'Personal card reimbursement limit is 0 — approval required',
        };
    }
    if (amount.lte(personalCardLimitVnd)) {
        return {
            applicable: true,
            deductible: amount,
            needsReview: false,
            reason: `Full reimbursement within ${personalCardLimitVnd} VND limit`,
        };
    }
    return {
        applicable: true,
        deductible: personalCardLimitVnd,
        needsReview: true,
        reason: `Capped at limit ${personalCardLimitVnd} VND; excess ${amount.minus(personalCardLimitVnd)} VND flagged for approval`,
    };
}
//# sourceMappingURL=gate3.evaluator.js.map