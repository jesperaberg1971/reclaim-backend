import { DataSource } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../../common/redis/redis.service';
import { SignedUrlService } from '../../common/storage/signed-url.service';
export interface ExpenseFilters {
    from?: string;
    to?: string;
    clientId?: string;
    employeeId?: string;
    gate?: number;
    status?: 'all' | 'pending_export' | 'exported';
    statusFilter?: 'needs_review' | 'approved' | 'rejected' | 'erp_exported';
    approvalDecision?: 'pending' | 'approved' | 'rejected';
    search?: string;
    page?: number;
    limit?: number;
}
export interface PagedExpenses {
    data: AccountingExpense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface AccountingExpense {
    id: string;
    receipt_date: string;
    employee_name: string;
    employee_internal_id: string;
    client_id: string;
    client_name: string;
    vendor: string | null;
    gate_applied: number;
    gate_label: string;
    original_amount_vnd: string;
    deductible_amount_vnd: string;
    currency: string;
    pit_flag: boolean;
    erp_exported: boolean;
    status: string;
    review_reason: string | null;
    supporting_documents: any[];
    has_voucher: boolean;
    accountant_reviewed_at: string | null;
    reviewer_note: string | null;
    approval_decision: string | null;
    parent_expense_id: string | null;
    split_child_count: number;
}
export interface AccountingExpenseDetail extends AccountingExpense {
    gate_explanation: string;
    accounting_debit: string;
    accounting_credit: string;
    overflow_amount_vnd: string | null;
    ocr_vendor: string | null;
    ocr_confidence: number;
    child_ids: string[];
    receipt_image_url: string | null;
    receipt_image_signed_url: string | null;
    voucher: {
        voucher_number: string;
        amount_vnd: string;
        bank_last_four: string | null;
    } | null;
    trip_decision: {
        start_date: string;
        end_date: string;
        destination: string | null;
        daily_allowance_vnd: string;
    } | null;
}
export interface ClientSummary {
    client_id: string;
    client_name: string;
    pending: number;
    approved: number;
    rejected: number;
    exported: number;
}
export interface DashboardMetrics {
    period: {
        from: string;
        to: string;
    };
    pending_approval: number;
    approved_ready_to_export: number;
    exported_this_period: number;
    rejected_this_period: number;
    total_clients_active: number;
    client_summary: ClientSummary[];
}
export interface RecentExport {
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}
export interface PeriodSummary {
    expense_count: number;
    total_original_vnd: string;
    total_deductible_vnd: string;
    total_pit_vnd: string;
    pending_export_count: number;
    exported_count: number;
    by_gate: Record<string, {
        count: number;
        deductible_vnd: string;
    }>;
}
export type SpendingGroupBy = 'category' | 'employee' | 'gate' | 'period';
export interface SpendingRow {
    group_key: string;
    group_label: string;
    expense_count: number;
    total_original_vnd: string;
    total_deductible_vnd: string;
    total_pit_vnd: string;
    percentage_of_total: number;
}
export interface SpendingBreakdown {
    group_by: SpendingGroupBy;
    from: string;
    to: string;
    rows: SpendingRow[];
    totals: {
        expense_count: number;
        total_original_vnd: string;
        total_deductible_vnd: string;
    };
}
export interface GateMetrics {
    gate: number;
    gate_label: string;
    expense_count: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    approval_rate: number;
    rejection_rate: number;
    escalation_rate: number;
    avg_processing_hours: number | null;
}
export interface GatePerformanceReport {
    from: string;
    to: string;
    gates: GateMetrics[];
    overall: {
        total_expenses: number;
        overall_approval_rate: number;
        overall_avg_processing_hours: number | null;
    };
}
export interface ClientInsight {
    client_id: string;
    client_name: string;
    employee_count: number;
    expense_count: number;
    total_original_vnd: string;
    total_deductible_vnd: string;
    approval_rate: number;
    rejection_rate: number;
    pending_count: number;
    erp_exported_count: number;
    erp_pending_count: number;
    avg_processing_hours: number | null;
    top_category: string | null;
}
export interface ClientInsightsReport {
    from: string;
    to: string;
    clients: ClientInsight[];
    portfolio_totals: {
        total_clients: number;
        total_expenses: number;
        total_original_vnd: string;
        total_deductible_vnd: string;
        overall_approval_rate: number;
    };
}
export declare class AccountingService {
    private readonly dataSource;
    private readonly notificationsService;
    private readonly redisService;
    private readonly signedUrlService;
    constructor(dataSource: DataSource, notificationsService: NotificationsService, redisService: RedisService, signedUrlService: SignedUrlService);
    listExpenses(tenantId: string, filters: ExpenseFilters): Promise<PagedExpenses>;
    getExpenseDetail(expenseId: string, tenantId: string): Promise<AccountingExpenseDetail>;
    listClients(tenantId: string): Promise<{
        id: string;
        name: string;
    }[]>;
    getPeriodSummary(tenantId: string, from: string, to: string, clientId?: string): Promise<PeriodSummary>;
    private toExpense;
    private buildExpenseCsv;
    private buildReviewReason;
    listEmployees(tenantId: string): Promise<{
        id: string;
        name: string;
        employee_id: string;
    }[]>;
    unmarkReviewed(expenseId: string, tenantId: string): Promise<void>;
    markReviewed(expenseId: string, tenantId: string, userId: string, note?: string): Promise<void>;
    getDashboardMetrics(tenantId: string, from: string, to: string): Promise<DashboardMetrics>;
    getRecentExports(tenantId: string, limit?: number): Promise<RecentExport[]>;
    rejectExpense(expenseId: string, tenantId: string, userId: string, note?: string): Promise<void>;
    getSpendingBreakdown(tenantId: string, from: string, to: string, groupBy?: SpendingGroupBy, clientId?: string): Promise<SpendingBreakdown>;
    getGatePerformance(tenantId: string, from: string, to: string, clientId?: string): Promise<GatePerformanceReport>;
    getClientInsights(tenantId: string, from: string, to: string): Promise<ClientInsightsReport>;
    exportAnalyticsCsv(tenantId: string, from: string, to: string, type: 'spending' | 'gate-performance' | 'client-insights', groupBy?: SpendingGroupBy, clientId?: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    buildDocumentZip(tenantId: string, from: string, to: string, clientId?: string): Promise<{
        buffer: Buffer;
        filename: string;
        expenseCount: number;
        fileCount: number;
        commentCount: number;
    }>;
}
