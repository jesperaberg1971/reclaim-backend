import { Expense } from './expense.entity';
export declare class PolicyLog {
    id: string;
    expense: Expense;
    expense_id: string;
    gate: number;
    decision_reason: string;
    created_at: Date;
}
