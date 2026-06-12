"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const expense_entity_1 = require("../../../database/entities/expense.entity");
const receipt_processing_service_1 = require("../receipt-processing.service");
function makeDecision(overrides = {}) {
    return {
        gate: 2,
        finalCategory: expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE,
        finalAmountDeductible: new decimal_js_1.Decimal(200_000),
        pitFlag: false,
        status: expense_entity_1.ExpenseStatus.APPROVED,
        reason: 'Within meal cap and welfare budget',
        ...overrides,
    };
}
describe('applyPolicyCategoryRules — allowed_categories', () => {
    test('empty allow-list: all categories pass through unchanged', () => {
        const d = makeDecision({ finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [], false, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
        expect(result).toBe(d);
    });
    test('category in allow-list: passes through unchanged', () => {
        const d = makeDecision({ finalCategory: expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE, expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE], false, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
    });
    test('category NOT in allow-list: status overridden to NEEDS_REVIEW', () => {
        const d = makeDecision({ finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE, expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE], false, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.NEEDS_REVIEW);
        expect(result.reason).toContain('not in partner allow-list');
        expect(result.finalCategory).toBe(expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT);
        expect(result.finalAmountDeductible).toEqual(new decimal_js_1.Decimal(200_000));
    });
    test('already NEEDS_REVIEW stays NEEDS_REVIEW; reason is extended', () => {
        const d = makeDecision({
            status: expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            reason: 'Gate 3 flagged for bank account',
            finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT,
        });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE], false, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.NEEDS_REVIEW);
        expect(result.reason).toContain('Gate 3 flagged for bank account');
        expect(result.reason).toContain('not in partner allow-list');
    });
});
describe('applyPolicyCategoryRules — require_original_receipt', () => {
    test('require=false: no effect regardless of image presence', () => {
        const d = makeDecision();
        expect((0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [], false, false).status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
        expect((0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [], false, true).status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
    });
    test('require=true + has image: passes through', () => {
        const d = makeDecision();
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [], true, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
    });
    test('require=true + no image: flags for review', () => {
        const d = makeDecision();
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [], true, false);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.NEEDS_REVIEW);
        expect(result.reason).toContain('Original receipt required');
    });
});
describe('applyPolicyCategoryRules — both rules active', () => {
    test('both rules violated: status is NEEDS_REVIEW and reason mentions both', () => {
        const d = makeDecision({ finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE], true, false);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.NEEDS_REVIEW);
        expect(result.reason).toContain('not in partner allow-list');
        expect(result.reason).toContain('Original receipt required');
    });
    test('only category rule violated: only that message added', () => {
        const d = makeDecision({ finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT });
        const result = (0, receipt_processing_service_1.applyPolicyCategoryRules)(d, [expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE], true, true);
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.NEEDS_REVIEW);
        expect(result.reason).toContain('not in partner allow-list');
        expect(result.reason).not.toContain('Original receipt');
    });
});
//# sourceMappingURL=policy-rules.spec.js.map