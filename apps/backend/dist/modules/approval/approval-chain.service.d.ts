import { DataSource } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';
export interface ApprovalStep {
    step_order: number;
    step_type: 'manager' | 'accountant';
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    decided_by: string | null;
    decided_at: string | null;
    note: string | null;
}
export interface ApprovalChainResponse {
    expense_id: string;
    steps: ApprovalStep[];
    current_step_type: 'manager' | 'accountant' | null;
    overall_status: 'pending' | 'fully_approved' | 'rejected' | 'no_chain';
}
export interface ApprovalQueueItem {
    expense_id: string;
    receipt_date: string;
    employee_name: string;
    client_name: string;
    original_amount: string;
    gate_applied: number;
    pending_step_type: 'manager' | 'accountant';
    step_pending_since: string;
}
export interface EscalationOutcome {
    type: 'all_done' | 'manager_escalated';
    expenseId: string;
}
export interface BulkActionResult {
    succeeded: string[];
    failed: {
        expenseId: string;
        error: string;
    }[];
}
export declare class ApprovalChainService {
    private readonly dataSource;
    private readonly notificationsService;
    private readonly auditService;
    constructor(dataSource: DataSource, notificationsService: NotificationsService, auditService: AuditService);
    getChain(expenseId: string, tenantId: string): Promise<ApprovalChainResponse>;
    approveStep(expenseId: string, tenantId: string, userId: string, role: string, note?: string): Promise<ApprovalChainResponse>;
    rejectStep(expenseId: string, tenantId: string, userId: string, role: string, note?: string): Promise<ApprovalChainResponse>;
    getPendingQueue(tenantId: string, role: string, clientId?: string): Promise<ApprovalQueueItem[]>;
    bulkApprove(expenseIds: string[], tenantId: string, userId: string, role: string, note?: string): Promise<BulkActionResult>;
    bulkReject(expenseIds: string[], tenantId: string, userId: string, role: string, note?: string): Promise<BulkActionResult>;
    skipManagerStepsForTenant(tenantId: string): Promise<void>;
    escalateStep(step: {
        id: string;
        expense_id: string;
        step_type: string;
    }, txManager: {
        query(sql: string, params?: unknown[]): Promise<any>;
    }): Promise<EscalationOutcome>;
    private toResponse;
}
