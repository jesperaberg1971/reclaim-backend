import { PdpdService } from './pdpd.service';
export declare class PdpdController {
    private readonly pdpdService;
    constructor(pdpdService: PdpdService);
    exportData(employeeId: string, req: any): Promise<import("./pdpd.service").EmployeeDataExport>;
    withdrawConsent(employeeId: string, req: any): Promise<{
        anonymized: boolean;
        employee_id: string;
    }>;
    recordConsent(employeeId: string, req: any): Promise<{
        employee_id: string;
        pdpd_consent: boolean;
    }>;
    getConsentLog(employeeId: string, req: any): Promise<import("./pdpd.service").ConsentLogEntry[]>;
}
