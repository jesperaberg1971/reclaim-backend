import { Employee } from './employee.entity';
export declare class EmployeeBankAccount {
    id: string;
    employee: Employee;
    employee_id: string;
    bank_name: string;
    account_number_encrypted: string;
    last_four: string;
    account_holder_name: string | null;
    is_primary: boolean;
    created_at: Date;
}
