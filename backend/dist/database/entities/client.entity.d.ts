import { Partner } from './partner.entity';
import { Employee } from './employee.entity';
export declare class Client {
    id: string;
    name: string;
    partnerId: string;
    partner: Partner;
    employees: Employee[];
    employee_count: number;
}
