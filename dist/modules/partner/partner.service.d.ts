import { DataSource } from 'typeorm';
import { CreateClientDto, UpdateClientDto, CreateEmployeeDto, UpdateEmployeeDto, PartnerReportQueryDto } from './dto/partner.dto';
export declare class PartnerService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getDashboard(partnerId: string): Promise<{
        totalClients: any;
        totalEmployees: any;
        totalExpenses: any;
        pendingExpenses: any;
        approvedExpenses: any;
        totalAmountVnd: any;
        expensesThisMonth: any;
    }>;
    listClients(partnerId: string): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: any;
        expense_count: any;
        pending_count: any;
    }[]>;
    createClient(partnerId: string, dto: CreateClientDto): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: number;
        expense_count: number;
        pending_count: number;
    }>;
    updateClient(clientId: string, partnerId: string, dto: UpdateClientDto): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: any;
        expense_count: any;
        pending_count: any;
    }>;
    private fetchClientInTx;
    listEmployees(partnerId: string, clientId?: string): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
        client_id: any;
        client_name: any;
    }[]>;
    createEmployee(partnerId: string, dto: CreateEmployeeDto): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
        client_id: string;
    }>;
    updateEmployee(employeeId: string, partnerId: string, dto: UpdateEmployeeDto): Promise<any>;
    getReports(partnerId: string, query: PartnerReportQueryDto): Promise<{
        from: string;
        to: string;
        items: any[];
    }>;
}
