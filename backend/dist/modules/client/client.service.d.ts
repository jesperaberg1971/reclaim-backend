import { DataSource } from 'typeorm';
export declare class ClientService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getDashboard(clientId: string): Promise<{
        totalEmployees: any;
        activeEmployees: any;
        totalExpenses: any;
        pendingExpenses: any;
        approvedExpenses: any;
        approvedAmountVnd: any;
        expensesThisMonth: any;
    }>;
    listEmployees(clientId: string): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
    }[]>;
    createEmployee(clientId: string, dto: {
        full_name: string;
        employee_id: string;
    }): Promise<any>;
    updateEmployee(employeeId: string, clientId: string, dto: {
        full_name?: string;
        is_active?: boolean;
        pdpd_consent?: boolean;
    }): Promise<any>;
    getExpenseSummary(clientId: string, from?: string, to?: string): Promise<{
        from: string;
        to: string;
        items: any[];
    }>;
}
