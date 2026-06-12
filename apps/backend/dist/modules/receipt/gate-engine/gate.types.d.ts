import { Decimal } from 'decimal.js';
import { ExpenseCategory, ExpenseStatus } from '../../../database/entities/expense.entity';
export interface TripDecisionCtx {
    id: string;
    status: 'pending' | 'approved' | 'cancelled';
    start_date: Date;
    end_date: Date;
    daily_allowance_amount: Decimal;
}
export interface PolicyCtx {
    meal_cap_vnd: Decimal;
    per_diem_daily_vnd: Decimal;
    welfare_monthly_cap_vnd: Decimal;
    personal_card_limit_vnd: Decimal;
}
export interface Gate1Result {
    applicable: boolean;
    deductible: Decimal;
    overflow: Decimal;
    reason: string;
}
export interface Gate2Result {
    deductible: Decimal;
    pitFlag: boolean;
    reason: string;
}
export interface Gate3Result {
    applicable: boolean;
    deductible: Decimal;
    needsReview: boolean;
    reason: string;
}
export interface GateDecision {
    gate: 1 | 2 | 3;
    finalCategory: ExpenseCategory;
    finalAmountDeductible: Decimal;
    pitFlag: boolean;
    status: ExpenseStatus;
    reason: string;
    childAmount?: Decimal;
}
