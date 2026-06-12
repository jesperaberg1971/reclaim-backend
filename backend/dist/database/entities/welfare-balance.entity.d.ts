import { Employee } from './employee.entity';
import { Decimal } from 'decimal.js';
export declare class WelfareBalance {
    id: string;
    employee: Employee;
    employee_id: string;
    amount: Decimal;
    balance_after: Decimal;
    reason: string;
    expense_id: string | null;
    period_month: string;
    created_at: Date;
}
