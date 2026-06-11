import { PartnerService } from './partner.service';
import { CreateClientDto, UpdateClientDto, CreateEmployeeDto, UpdateEmployeeDto, PartnerReportQueryDto } from './dto/partner.dto';
export declare class PartnerController {
    private readonly partnerService;
    constructor(partnerService: PartnerService);
    getPortal(): string;
    getDashboard(req: any): Promise<{
        totalClients: any;
        totalEmployees: any;
        totalExpenses: any;
        pendingExpenses: any;
        approvedExpenses: any;
        totalAmountVnd: any;
        expensesThisMonth: any;
    }>;
    listClients(req: any): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: any;
        expense_count: any;
        pending_count: any;
    }[]>;
    createClient(req: any, dto: CreateClientDto): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: number;
        expense_count: number;
        pending_count: number;
    }>;
    updateClient(id: string, req: any, dto: UpdateClientDto): Promise<{
        id: any;
        name: any;
        is_active: any;
        created_at: string;
        employee_count: any;
        expense_count: any;
        pending_count: any;
    }>;
    listEmployees(req: any, clientId?: string): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
        client_id: any;
        client_name: any;
    }[]>;
    createEmployee(req: any, dto: CreateEmployeeDto): Promise<{
        id: any;
        employee_id: any;
        full_name: any;
        is_active: any;
        pdpd_consent: any;
        client_id: string;
    }>;
    updateEmployee(id: string, req: any, dto: UpdateEmployeeDto): Promise<any>;
    getReports(req: any, query: PartnerReportQueryDto): Promise<{
        from: string;
        to: string;
        items: any[];
    }>;
    testRls(req: any): Promise<{
        message: string;
        count: number;
        clients: {
            id: any;
            name: any;
            is_active: any;
            created_at: string;
            employee_count: any;
            expense_count: any;
            pending_count: any;
        }[];
    }>;
}
