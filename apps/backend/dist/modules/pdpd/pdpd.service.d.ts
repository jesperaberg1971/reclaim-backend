import { DataSource } from 'typeorm';
export type ConsentEvent = 'consent_given' | 'consent_withdrawn' | 'data_exported' | 'data_anonymized';
export interface ConsentLogEntry {
    id: string;
    employee_id: string | null;
    event: ConsentEvent;
    performed_by_user_id: string | null;
    performed_by_role: string | null;
    ip_address: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}
export interface EmployeeDataExport {
    employee: {
        id: string;
        employee_id: string;
        full_name: string | null;
        client_id: string;
        client_name: string | null;
        partner_id: string | null;
        is_active: boolean;
        pdpd_consent: boolean;
    };
    bank_accounts: Array<{
        id: string;
        bank_name: string;
        account_number_last4: string;
        is_primary: boolean;
    }>;
    expenses: Array<{
        id: string;
        receipt_date: string | null;
        final_category: string | null;
        original_amount: string;
        status: string;
        created_at: string;
    }>;
    attendance: Array<{
        id: string;
        latitude: number | null;
        longitude: number | null;
        created_at: string;
    }>;
    consent_log: ConsentLogEntry[];
    exported_at: string;
}
export declare class PdpdService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    exportEmployeeData(employeeId: string, requestorPartnerId: string | null, requestorUserId: string | null, requestorRole: string | null, ipAddress?: string): Promise<EmployeeDataExport>;
    withdrawConsent(employeeId: string, requestorPartnerId: string | null, requestorUserId: string | null, requestorRole: string | null, ipAddress?: string): Promise<{
        anonymized: boolean;
        employee_id: string;
    }>;
    recordConsentGiven(employeeId: string, requestorPartnerId: string | null, requestorUserId: string | null, requestorRole: string | null, ipAddress?: string): Promise<{
        employee_id: string;
        pdpd_consent: boolean;
    }>;
    getConsentLog(employeeId: string, requestorPartnerId: string | null, requestorRole: string | null): Promise<ConsentLogEntry[]>;
    private logEvent;
    private mapLogRow;
}
