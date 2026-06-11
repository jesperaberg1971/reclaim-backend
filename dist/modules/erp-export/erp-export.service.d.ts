import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { ExpenseRepository } from '../receipt/repositories/expense.repository';
import { StructuredExportRequestDto } from './dto/structured-export-request.dto';
import { WebhookService } from './webhook.service';
import { BatchJobState } from './dto/webhook.dto';
import { RedisService } from '../../common/redis/redis.service';
export declare class ErpExportService {
    private readonly expenseRepo;
    private readonly dataSource;
    private readonly batchQueue;
    private readonly webhookService;
    private readonly redisService;
    private readonly logger;
    constructor(expenseRepo: ExpenseRepository, dataSource: DataSource, batchQueue: Queue, webhookService: WebhookService, redisService: RedisService);
    exportToErp(tenantId: string, dto: {
        erpType: 'MISA' | 'BIZZI' | 'SAP';
        clientId?: string;
    }): Promise<{
        success: boolean;
        exportedCount: number;
        erpType: "MISA" | "BIZZI" | "SAP";
        payload: any;
    }>;
    generateStructuredExport(tenantId: string, dto: StructuredExportRequestDto, options?: {
        fireWebhook?: boolean;
    }): Promise<ExportPackage>;
    generateMisaCsv(tenantId: string, dto: StructuredExportRequestDto): Promise<string>;
    private toExpenseRecord;
    private fetchCommentsMap;
    private computeSummary;
    private buildSplitGroups;
    private buildValidationReport;
    private emptyPackage;
    startBatchExport(tenantId: string, dto: StructuredExportRequestDto): Promise<{
        jobId: string;
        status: 'queued';
    }>;
    getBatchExportStatus(tenantId: string, jobId: string): Promise<BatchJobState | null>;
}
export interface GateSummary {
    count: number;
    total_deductible_vnd: string;
}
export interface SplitGroup {
    parent_id: string;
    child_ids: string[];
    total_split: string;
}
export interface ValidationIssue {
    expense_id: string;
    level: 'ERROR' | 'WARN' | 'INFO';
    code: string;
    message: string;
}
export interface ValidationReport {
    valid: boolean;
    issues: ValidationIssue[];
    total_issues: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    blocking_reasons: string[];
}
interface StructuredExpense {
    id: string;
    parent_expense_id: string | null;
    children: string[];
    receipt_date: string;
    employee: {
        id: string;
        name: string;
        internal_id: string;
    };
    client: {
        id: string;
        name: string;
    };
    vendor: string | null;
    ocr_confidence: number;
    original_amount_vnd: string;
    deductible_amount_vnd: string;
    currency: string;
    gate_applied: 1 | 2 | 3;
    category: string;
    pit_flag: boolean;
    already_exported: boolean;
    supporting_documents: any[];
    accounting: {
        debit_account: string;
        credit_account: string;
        description: string;
    };
    voucher?: {
        voucher_number: string;
        employee_name: string;
        amount_vnd: string;
        bank_last_four: string | null;
    };
    comments: {
        id: string;
        user_email: string;
        user_role: string;
        body: string;
        created_at: string;
    }[];
}
export interface ExportPackage {
    schema_version: '2.0';
    metadata: {
        generated_at: string;
        period: {
            from: string;
            to: string;
        };
        tenant_name: string;
        company_display_name: string;
        logo_url: string | null;
        client_name: string | null;
        expense_count: number;
        total_original_vnd: string;
        total_deductible_vnd: string;
        total_pit_applicable_vnd: string;
        marked_as_exported: boolean;
    };
    expenses: StructuredExpense[];
    summary: {
        by_gate: Record<string, GateSummary>;
        by_category: Record<string, number>;
        pit_summary: {
            expenses_with_pit: number;
            total_pit_amount_vnd: string;
        };
        split_groups: SplitGroup[];
    };
    validation_report: ValidationReport;
    supporting_documents: any[];
}
export {};
