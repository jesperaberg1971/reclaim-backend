import { Decimal } from 'decimal.js';
export declare class ProcessReceiptResult {
    gate: 1 | 2 | 3;
    finalCategory: 'travel_allowance' | 'welfare_allowance' | 'personal_card_reimbursement' | 'flagged';
    finalAmountDeductible: Decimal;
    reason: string;
    pitFlag: boolean;
}
