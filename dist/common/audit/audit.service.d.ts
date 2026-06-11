import { DataSource } from 'typeorm';
export type AuditAction = 'login' | 'login_failed' | 'erp_export' | 'misa_csv_export' | 'hitl_approve' | 'hitl_reject' | 'hitl_bulk_action' | 'hitl_correction' | 'accounting_export' | 'partner_created' | 'client_created' | 'employee_created' | 'voucher_download' | 'accountant_review' | 'expense_approve' | 'expense_reject' | 'policy_update' | 'client_policy_set' | 'client_policy_delete';
export interface AuditEvent {
    tenantId?: string;
    userId?: string;
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
}
export declare class AuditService {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    log(event: AuditEvent): Promise<void>;
}
