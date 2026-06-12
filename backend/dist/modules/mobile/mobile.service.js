"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MobileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileService = exports.MAX_BATCH_SIZE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const decimal_js_1 = require("decimal.js");
const crypto_1 = require("crypto");
const expense_repository_1 = require("../receipt/repositories/expense.repository");
const redis_service_1 = require("../../common/redis/redis.service");
const expense_entity_1 = require("../../database/entities/expense.entity");
const queue_constants_1 = require("../queue/queue.constants");
const failure_messages_1 = require("../../common/utils/failure-messages");
const receipt_image_util_1 = require("../../common/storage/receipt-image.util");
const date_1 = require("../../common/utils/date");
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/tiff',
    'image/bmp', 'image/webp', 'application/pdf',
]);
const LIST_EXPENSES_MAX_LIMIT = 100;
const STATUS_COPY = {
    [expense_entity_1.ExpenseStatus.PENDING_OCR]: { message: 'Your receipt is in the processing queue.', action: 'wait' },
    [expense_entity_1.ExpenseStatus.PROCESSING]: { message: 'Scanning your receipt — this usually takes under 10 seconds.', action: 'wait' },
    [expense_entity_1.ExpenseStatus.COMPLETE]: { message: 'Receipt scanned successfully.', action: 'done' },
    [expense_entity_1.ExpenseStatus.NEEDS_REVIEW]: { message: 'Your receipt needs a brief manual review.', action: 'in_review' },
    [expense_entity_1.ExpenseStatus.FAILED]: { message: 'We were unable to process this receipt.', action: 'reupload' },
    [expense_entity_1.ExpenseStatus.APPROVED]: { message: 'Expense approved and ready for accounting.', action: 'done' },
    [expense_entity_1.ExpenseStatus.REJECTED]: { message: 'This expense was not approved.', action: 'rejected' },
    [expense_entity_1.ExpenseStatus.ERP_EXPORTED]: { message: 'Expense has been exported to your accounting system.', action: 'done' },
};
const OCR_DATA_STATUSES = new Set([
    expense_entity_1.ExpenseStatus.COMPLETE,
    expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
    expense_entity_1.ExpenseStatus.APPROVED,
    expense_entity_1.ExpenseStatus.FAILED,
]);
const MAX_IDEM_KEY_LEN = 128;
const IDEM_TTL_S = 86_400;
exports.MAX_BATCH_SIZE = 10;
let MobileService = MobileService_1 = class MobileService {
    constructor(ocrQueue, expenseRepo, redisService) {
        this.ocrQueue = ocrQueue;
        this.expenseRepo = expenseRepo;
        this.redisService = redisService;
        this.logger = new common_1.Logger(MobileService_1.name);
    }
    async enqueueReceiptUpload(file, user, employeeId, idempotencyKey) {
        const idemCacheKey = this.resolveIdemKey(user.userId, idempotencyKey);
        if (idemCacheKey) {
            const cached = await this.redisService.cacheGet(idemCacheKey);
            if (cached) {
                this.logger.log(`Idempotency hit key=${idempotencyKey} user=${user.userId}`);
                return JSON.parse(cached);
            }
        }
        if (!user.clientId) {
            throw new common_1.BadRequestException('Your account is not linked to a company. Please contact your administrator.');
        }
        const resolvedEmployeeId = employeeId ?? user.employeeId;
        if (!resolvedEmployeeId) {
            throw new common_1.BadRequestException('Employee ID is required. Pass it as the "employeeId" form field, or log in with an employee account.');
        }
        if (user.clientId) {
            const [empCheck] = await this.expenseRepo.repository.manager.query(`SELECT 1 FROM employees WHERE id = $1 AND client_id = $2 LIMIT 1`, [resolvedEmployeeId, user.clientId]);
            if (!empCheck) {
                throw new common_1.BadRequestException('Employee ID does not match your account.');
            }
        }
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new common_1.BadRequestException(`File type "${file.mimetype}" is not supported. Please upload a JPEG, PNG, TIFF, BMP, WebP, or PDF file.`);
        }
        if (file.size > MAX_FILE_BYTES) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            throw new common_1.BadRequestException(`File is ${sizeMb} MB which exceeds the 20 MB limit. Please compress or resize your image.`);
        }
        const expenseId = (0, crypto_1.randomUUID)();
        const imageUrl = await (0, receipt_image_util_1.saveReceiptImage)(file.buffer, file.mimetype, expenseId);
        const imageDoc = {
            type: 'receipt_image',
            url: imageUrl,
            filename: `${expenseId}.${(0, receipt_image_util_1.mimeToExt)(file.mimetype)}`,
            generated_at: new Date().toISOString(),
        };
        const imageRedisKey = `receipt:temp:${(0, crypto_1.randomUUID)()}`;
        await this.redisService.setTempImage(imageRedisKey, file.buffer.toString('base64'));
        const stub = this.expenseRepo.repository.create({
            id: expenseId,
            employee_id: resolvedEmployeeId,
            client_id: user.clientId,
            receipt_date: new Date(),
            original_amount: new decimal_js_1.Decimal('0'),
            final_amount_deductible: new decimal_js_1.Decimal('0'),
            receipt_image_url: imageUrl,
            supporting_documents: [imageDoc],
            ocr_raw_json: {},
            gate_applied: 0,
            final_category: 'pending',
            pit_flag: false,
            erp_exported: false,
            status: expense_entity_1.ExpenseStatus.PENDING_OCR,
        });
        await this.expenseRepo.repository.save(stub);
        const jobData = {
            expenseId,
            tenantId: user.tenantId,
            imageRedisKey,
            mimeType: file.mimetype,
        };
        await this.ocrQueue.add('process-receipt', jobData, { jobId: expenseId });
        this.logger.log(`Receipt queued — expenseId=${expenseId} tenant=${user.tenantId}`);
        const result = {
            expenseId,
            status: expense_entity_1.ExpenseStatus.PENDING_OCR,
            user_message: STATUS_COPY[expense_entity_1.ExpenseStatus.PENDING_OCR].message,
            receipt_image_url: imageUrl,
        };
        if (idemCacheKey) {
            await this.redisService.cacheSet(idemCacheKey, JSON.stringify(result), IDEM_TTL_S);
        }
        return result;
    }
    resolveIdemKey(userId, key) {
        if (!key)
            return null;
        const trimmed = key.trim().slice(0, MAX_IDEM_KEY_LEN);
        if (!trimmed)
            return null;
        return `mobile:idem:${userId}:${trimmed}`;
    }
    async batchUploadReceipts(files, user, employeeId, idempotencyKeys = []) {
        const outcomes = await Promise.allSettled(files.map((file, index) => this.enqueueReceiptUpload(file, user, employeeId, idempotencyKeys[index])
            .then(r => ({ index, ...r }))));
        const results = outcomes.map((outcome, index) => outcome.status === 'fulfilled'
            ? { index, ...outcome.value }
            : { index, error: outcome.reason.message ?? 'Unknown error' });
        return {
            total: files.length,
            succeeded: results.filter(r => !r.error).length,
            failed: results.filter(r => !!r.error).length,
            results,
        };
    }
    async getExpenseList(user, query) {
        const limit = Math.min(query.limit ?? 50, LIST_EXPENSES_MAX_LIMIT);
        const offset = query.offset ?? 0;
        const conditions = [];
        const params = [];
        let i = 1;
        if (user.role === 'employee') {
            if (query.employeeId) {
                params.push(query.employeeId, user.clientId);
                conditions.push(`e.employee_id = $${i++}`);
                conditions.push(`e.client_id   = $${i++}`);
            }
            else {
                params.push(user.clientId);
                conditions.push(`e.client_id = $${i++}`);
            }
        }
        else if (query.employeeId) {
            params.push(query.employeeId);
            conditions.push(`e.employee_id = $${i++}`);
        }
        if (query.since) {
            params.push(query.since);
            conditions.push(`e.created_at >= $${i++}`);
        }
        if (query.status) {
            const statuses = query.status.split(',').map(s => s.trim()).filter(Boolean);
            if (statuses.length) {
                params.push(statuses);
                conditions.push(`e.status = ANY($${i++}::text[])`);
            }
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRows = await this.expenseRepo.repository.manager.query(`SELECT COUNT(*)::text AS total FROM expenses e ${where}`, params);
        const total = Number(countRows[0].total);
        params.push(limit, offset);
        const rows = await this.expenseRepo.repository.manager.query(`SELECT e.id, e.status, e.gate_applied, e.final_category,
              e.original_amount::text, e.final_amount_deductible::text,
              e.currency, e.receipt_date, e.receipt_image_url,
              e.supporting_documents, e.pit_flag, e.created_at,
              e.ocr_raw_json->>'vendor' AS vendor
       FROM expenses e
       ${where}
       ORDER BY e.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`, params);
        const expenses = rows.map(r => ({
            id: r.id,
            status: r.status,
            gate_applied: Number(r.gate_applied),
            final_category: r.final_category,
            original_amount: r.original_amount,
            final_amount_deductible: r.final_amount_deductible,
            currency: r.currency,
            receipt_date: (0, date_1.toIso)(r.receipt_date),
            receipt_image_url: r.receipt_image_url ?? '',
            supporting_documents: Array.isArray(r.supporting_documents)
                ? r.supporting_documents
                : [],
            vendor: r.vendor ?? null,
            pit_flag: Boolean(r.pit_flag),
            created_at: (0, date_1.toIso)(r.created_at),
        }));
        const sync_token = expenses.length > 0 ? expenses[0].created_at : null;
        return { expenses, total, limit, offset, sync_token };
    }
    async getEmployeeProfile(clientId) {
        if (!clientId)
            return { employeeId: null, fullName: null };
        const [emp] = await this.expenseRepo.repository.manager.query(`SELECT id, full_name FROM employees WHERE client_id = $1 ORDER BY created_at LIMIT 1`, [clientId]);
        return { employeeId: emp?.id ?? null, fullName: emp?.full_name ?? null };
    }
    async getExpenseStatus(expenseId, tenantId) {
        const [ownership] = await this.expenseRepo.repository.manager.query(`SELECT e.id
       FROM expenses e
       JOIN clients c ON c.id = e.client_id
       WHERE e.id = $1 AND c.partner_id = $2
       LIMIT 1`, [expenseId, tenantId]);
        if (!ownership) {
            throw new common_1.NotFoundException(`Receipt with ID "${expenseId}" was not found. It may still be uploading — please try again in a moment.`);
        }
        const expense = await this.expenseRepo.repository.findOne({
            where: { id: expenseId },
            select: ['id', 'status', 'ocr_raw_json'],
        });
        if (!expense) {
            throw new common_1.NotFoundException(`Receipt with ID "${expenseId}" was not found. It may still be uploading — please try again in a moment.`);
        }
        const status = expense.status;
        const copy = STATUS_COPY[status] ?? {
            message: 'Your receipt is being processed.',
            action: 'wait',
        };
        const reasonCodes = expense.ocr_raw_json?.diagnostics?.failure_reasons ?? [];
        const failureReasonsHuman = (0, failure_messages_1.getFailureMessages)(reasonCodes);
        let userMessage = copy.message;
        if (status === expense_entity_1.ExpenseStatus.NEEDS_REVIEW && failureReasonsHuman.length) {
            userMessage += ` ${failureReasonsHuman[0].detail}`;
        }
        if (status === expense_entity_1.ExpenseStatus.REJECTED) {
            const reviewerNote = expense.ocr_raw_json?.reviewer_notes;
            if (reviewerNote) {
                userMessage += ` Reason: ${reviewerNote}`;
            }
        }
        return {
            expenseId,
            status,
            user_message: userMessage,
            action_required: copy.action,
            failure_reasons_human: failureReasonsHuman,
            ...(OCR_DATA_STATUSES.has(status) && expense.ocr_raw_json
                ? { ocrData: expense.ocr_raw_json }
                : {}),
        };
    }
};
exports.MobileService = MobileService;
exports.MobileService = MobileService = MobileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queue_constants_1.OCR_QUEUE)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        expense_repository_1.ExpenseRepository,
        redis_service_1.RedisService])
], MobileService);
//# sourceMappingURL=mobile.service.js.map