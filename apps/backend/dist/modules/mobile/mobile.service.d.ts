import { Queue } from 'bullmq';
import { ExpenseRepository } from '../receipt/repositories/expense.repository';
import { RedisService } from '../../common/redis/redis.service';
import { ExpenseStatus } from '../../database/entities/expense.entity';
import { JwtPayload } from '../auth/dto/jwt-payload.interface';
import { FailureMessage } from '../../common/utils/failure-messages';
import { SignedUrlService } from '../../common/storage/signed-url.service';
export interface MobileExpenseItem {
    id: string;
    status: string;
    gate_applied: number;
    final_category: string;
    original_amount: string;
    final_amount_deductible: string;
    currency: string;
    receipt_date: string;
    receipt_image_url: string;
    receipt_image_signed_url: string | null;
    supporting_documents: Array<{
        type: string;
        url: string;
        filename?: string;
        generated_at: string;
    }>;
    vendor: string | null;
    pit_flag: boolean;
    created_at: string;
}
export interface ExpenseListResponse {
    expenses: MobileExpenseItem[];
    total: number;
    limit: number;
    offset: number;
    sync_token: string | null;
}
export interface ListExpensesQuery {
    since?: string;
    status?: string;
    employeeId?: string;
    limit?: number;
    offset?: number;
}
export type ActionRequired = 'wait' | 'in_review' | 'done' | 'reupload' | 'rejected';
export interface StatusResponse {
    expenseId: string;
    status: ExpenseStatus;
    user_message: string;
    action_required: ActionRequired;
    failure_reasons_human: FailureMessage[];
    ocrData?: Record<string, any>;
}
export declare const MAX_BATCH_SIZE = 10;
export interface BatchUploadItemResult {
    index: number;
    expenseId?: string;
    status?: ExpenseStatus;
    user_message?: string;
    receipt_image_url?: string;
    error?: string;
}
export interface BatchUploadResponse {
    total: number;
    succeeded: number;
    failed: number;
    results: BatchUploadItemResult[];
}
export declare class MobileService {
    private readonly ocrQueue;
    private readonly expenseRepo;
    private readonly redisService;
    private readonly signedUrlService;
    private readonly logger;
    constructor(ocrQueue: Queue, expenseRepo: ExpenseRepository, redisService: RedisService, signedUrlService: SignedUrlService);
    enqueueReceiptUpload(file: Express.Multer.File, user: JwtPayload, employeeId?: string, idempotencyKey?: string): Promise<{
        expenseId: string;
        status: ExpenseStatus;
        user_message: string;
        receipt_image_url: string;
        receipt_image_signed_url: string | null;
    }>;
    private resolveIdemKey;
    batchUploadReceipts(files: Express.Multer.File[], user: JwtPayload, employeeId?: string, idempotencyKeys?: string[]): Promise<BatchUploadResponse>;
    getExpenseList(user: JwtPayload, query: ListExpensesQuery): Promise<ExpenseListResponse>;
    getEmployeeProfile(clientId?: string): Promise<{
        employeeId: string | null;
        fullName: string | null;
    }>;
    getExpenseStatus(expenseId: string, tenantId: string): Promise<StatusResponse>;
}
