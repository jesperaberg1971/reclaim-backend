"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGate1 = evaluateGate1;
const decimal_js_1 = require("decimal.js");
const ZERO = new decimal_js_1.Decimal(0);
function evaluateGate1(amount, receiptDate, trip) {
    if (!trip) {
        return { applicable: false, deductible: ZERO, overflow: ZERO, reason: 'No trip decision on file' };
    }
    if (trip.status !== 'approved') {
        return {
            applicable: false,
            deductible: ZERO,
            overflow: ZERO,
            reason: `Trip decision status is '${trip.status}' — must be 'approved'`,
        };
    }
    const receiptDay = midnight(receiptDate);
    const tripStart = midnight(trip.start_date);
    const tripEnd = midnight(trip.end_date);
    if (receiptDay < tripStart) {
        return {
            applicable: false,
            deductible: ZERO,
            overflow: ZERO,
            reason: `Receipt date ${fmtDate(receiptDate)} is before trip start ${fmtDate(trip.start_date)}`,
        };
    }
    if (receiptDay > tripEnd) {
        return {
            applicable: false,
            deductible: ZERO,
            overflow: ZERO,
            reason: `Receipt date ${fmtDate(receiptDate)} is after trip end ${fmtDate(trip.end_date)}`,
        };
    }
    if (amount.lte(ZERO)) {
        return {
            applicable: true,
            deductible: ZERO,
            overflow: ZERO,
            reason: 'Zero-amount receipt — no deduction',
        };
    }
    const allowance = trip.daily_allowance_amount;
    if (amount.lte(allowance)) {
        return {
            applicable: true,
            deductible: amount,
            overflow: ZERO,
            reason: `Within daily allowance of ${allowance} VND`,
        };
    }
    return {
        applicable: true,
        deductible: allowance,
        overflow: amount.minus(allowance),
        reason: `Daily allowance ${allowance} VND applied; overflow ${amount.minus(allowance)} VND routed to Gate 2`,
    };
}
function midnight(d) {
    const copy = new Date(d);
    copy.setUTCHours(0, 0, 0, 0);
    return copy.getTime();
}
function fmtDate(d) {
    return new Date(d).toISOString().slice(0, 10);
}
//# sourceMappingURL=gate1.evaluator.js.map