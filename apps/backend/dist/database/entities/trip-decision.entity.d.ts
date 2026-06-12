import { Employee } from './employee.entity';
import { Decimal } from 'decimal.js';
export declare class TripDecision {
    id: string;
    employee: Employee;
    employee_id: string;
    start_date: Date;
    end_date: Date;
    daily_allowance_amount: Decimal;
    status: 'pending' | 'approved' | 'cancelled';
    destination: string | null;
    purpose: string | null;
}
