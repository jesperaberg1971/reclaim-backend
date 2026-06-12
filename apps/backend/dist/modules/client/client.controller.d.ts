import { ClientService } from './client.service';
declare class CreateEmployeeDto {
    full_name: string;
    employee_id: string;
}
declare class UpdateEmployeeDto {
    full_name?: string;
    is_active?: boolean;
    pdpd_consent?: boolean;
}
export declare class ClientController {
    private readonly clientService;
    constructor(clientService: ClientService);
    getDashboard(req: any): Promise<{
        totalEmployees: any;
        activeEmployees: any;
        totalExpenses: any;
        pendingExpenses: any;
        approvedExpenses: any;
        approvedAmountVnd: any;
        expensesThisMonth: any;
    }>;
    listEmployees(req: any): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
    }[]>;
    createEmployee(req: any, dto: CreateEmployeeDto): Promise<any>;
    updateEmployee(id: string, req: any, dto: UpdateEmployeeDto): Promise<any>;
    getExpenses(req: any, from?: string, to?: string): Promise<{
        from: string;
        to: string;
        items: any[];
    }>;
}
export {};
