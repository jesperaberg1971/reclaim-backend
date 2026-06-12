import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ReceiptProcessingService } from '../receipt/receipt-processing.service';
import { RedisService } from '../../common/redis/redis.service';
import { AuditService } from '../../common/audit/audit.service';
import { OcrCorrectionDto } from './dto/ocr-correction.dto';
import { BulkActionType } from './dto/bulk-action.dto';
export declare class HitlService {
    private readonly dataSource;
    private readonly receiptProcessingService;
    private readonly redisService;
    private readonly auditService;
    private readonly logger;
    constructor(dataSource: DataSource, receiptProcessingService: ReceiptProcessingService, redisService: RedisService, auditService: AuditService);
    getQueue(tenantId: string): Promise<ReviewQueueItem[]>;
    getDetail(expenseId: string, tenantId: string): Promise<ExpenseDetail>;
    applyCorrection(expenseId: string, tenantId: string, dto: OcrCorrectionDto, userId?: string, ipAddress?: string): Promise<CorrectionResult>;
    rejectExpense(expenseId: string, tenantId: string, reason?: string, userId?: string, ipAddress?: string): Promise<void>;
    bulkAction(expenseIds: string[], action: BulkActionType, tenantId: string, reviewerNotes?: string, userId?: string, ipAddress?: string): Promise<BulkResult>;
    private bulkApproveOne;
    getOcrMetrics(period?: string): Promise<import("../../common/redis/redis.service").OcrMetrics>;
}
export interface ReviewQueueItem {
    id: string;
    receipt_date: Date;
    original_amount: Decimal;
    vendor: string | null;
    ocr_confidence: number;
    failure_reasons: string[];
    created_at: Date;
    employee_name: string | null;
    client_name: string | null;
}
export interface ExpenseDetail extends ReviewQueueItem {
    ocr_raw_json: any;
    status: string;
    gate_applied: number;
    supporting_documents: any[];
    employee_internal_id: string | null;
    receipt_image_url: string | null;
    already_processed: boolean;
}
export interface CorrectionResult {
    expenseId: string;
    gate: number;
    category: string;
    status: string;
    deductible_vnd: string;
    pit_flag: boolean;
    reason: string;
}
export interface BulkResult {
    succeeded: string[];
    failed: Array<{
        id: string;
        error: string;
    }>;
}
