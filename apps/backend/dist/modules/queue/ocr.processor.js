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
var OcrProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const ocr_service_1 = require("../ocr/ocr.service");
const ocr_failure_types_1 = require("../ocr/ocr-failure.types");
const redis_service_1 = require("../../common/redis/redis.service");
const receipt_processing_service_1 = require("../receipt/receipt-processing.service");
const expense_entity_1 = require("../../database/entities/expense.entity");
const queue_constants_1 = require("./queue.constants");
const CONFIDENCE_THRESHOLD = 0.60;
let OcrProcessor = OcrProcessor_1 = class OcrProcessor extends bullmq_1.WorkerHost {
    constructor(ocrService, redisService, receiptProcessingService, dataSource) {
        super();
        this.ocrService = ocrService;
        this.redisService = redisService;
        this.receiptProcessingService = receiptProcessingService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(OcrProcessor_1.name);
    }
    async process(job) {
        const { expenseId, tenantId, imageRedisKey, mimeType } = job.data;
        const attempt = (job.attemptsMade ?? 0) + 1;
        const jobStart = Date.now();
        this.logger.log(`[OCR] start job=${job.id} expense=${expenseId} tenant=${tenantId} attempt=${attempt}/${job.opts.attempts ?? 3}`);
        await this.updateExpense(tenantId, expenseId, { status: expense_entity_1.ExpenseStatus.PROCESSING });
        const base64 = await this.redisService.getTempImage(imageRedisKey);
        if (!base64) {
            this.logger.warn(`[OCR] Image expired in Redis key=${imageRedisKey} expense=${expenseId}`);
            await this.failPermanently(tenantId, expenseId, { failure_reasons: ['image_expired'], processing_ms: 0 });
            return;
        }
        const imageBuffer = Buffer.from(base64, 'base64');
        let ocrResult;
        try {
            ocrResult = await this.ocrService.extractFromImage(imageBuffer, mimeType, attempt);
        }
        catch (err) {
            return this.handleOcrError(err, job, tenantId, expenseId, imageRedisKey);
        }
        const { diagnostics } = ocrResult;
        const finalStatus = diagnostics.hitl_required || ocrResult.confidence < CONFIDENCE_THRESHOLD
            ? expense_entity_1.ExpenseStatus.NEEDS_REVIEW
            : expense_entity_1.ExpenseStatus.COMPLETE;
        const amount = new decimal_js_1.Decimal(String(ocrResult.amount || 0));
        const ocrLogFn = finalStatus === expense_entity_1.ExpenseStatus.NEEDS_REVIEW ? 'warn' : 'log';
        this.logger[ocrLogFn](`[OCR] done expense=${expenseId} tenant=${tenantId} status=${finalStatus} ` +
            `weighted_conf=${ocrResult.confidence.toFixed(2)} ` +
            `hitl_required=${diagnostics.hitl_required} ` +
            `reasons=${JSON.stringify(diagnostics.failure_reasons)} ` +
            `ocr_ms=${diagnostics.processing_ms} total_ms=${Date.now() - jobStart}`);
        await this.updateExpense(tenantId, expenseId, {
            status: finalStatus,
            ocr_raw_json: { ...ocrResult },
            original_amount: amount,
            final_amount_deductible: amount,
            receipt_date: new Date(ocrResult.date),
        });
        await this.redisService.deleteTempImage(imageRedisKey);
        await Promise.allSettled([
            this.redisService.recordOcrOutcome(finalStatus === expense_entity_1.ExpenseStatus.COMPLETE ? 'complete'
                : finalStatus === expense_entity_1.ExpenseStatus.NEEDS_REVIEW ? 'needs_review'
                    : 'failed'),
            diagnostics.failure_reasons.length
                ? this.redisService.recordOcrFailureReasons(diagnostics.failure_reasons)
                : Promise.resolve(),
        ]);
        if (finalStatus === expense_entity_1.ExpenseStatus.COMPLETE) {
            const gateStart = Date.now();
            try {
                const decision = await this.receiptProcessingService.processExpense(expenseId, tenantId);
                this.logger.log(`[Gate] done expense=${expenseId} tenant=${tenantId} gate=${decision.gate} ` +
                    `category=${decision.finalCategory} deductible=${decision.finalAmountDeductible} VND ` +
                    `pit_flag=${decision.pitFlag} gate_ms=${Date.now() - gateStart}`);
            }
            catch (gateErr) {
                this.logger.error(`[Gate] failed expense=${expenseId} tenant=${tenantId} ` +
                    `gate_ms=${Date.now() - gateStart} error="${gateErr.message}"`);
            }
        }
    }
    async handleOcrError(err, job, tenantId, expenseId, imageRedisKey) {
        const attempt = (job.attemptsMade ?? 0) + 1;
        const maxAttempts = job.opts.attempts ?? 3;
        const isLast = attempt >= maxAttempts;
        const failureReason = classifyNetworkError(err);
        this.logger.error(`[OCR] FAILED expense=${expenseId} attempt=${attempt}/${maxAttempts} ` +
            `retryable=${(0, ocr_service_1.isRetryableOcrError)(err)} reason=${failureReason} ` +
            `error="${err.message}"`);
        if (!(0, ocr_service_1.isRetryableOcrError)(err)) {
            await this.failPermanently(tenantId, expenseId, { failure_reasons: [failureReason] });
            await this.redisService.deleteTempImage(imageRedisKey);
            return;
        }
        if (isLast) {
            await this.failPermanently(tenantId, expenseId, { failure_reasons: [failureReason] });
            await this.redisService.deleteTempImage(imageRedisKey);
        }
        else {
            await this.redisService.recordOcrFailureReasons([failureReason]);
        }
        throw err;
    }
    async failPermanently(tenantId, expenseId, partialDiagnostics) {
        const ocr_raw_json = {
            vendor: null,
            amount: 0,
            confidence: 0,
            diagnostics: {
                hitl_required: true,
                failure_reasons: partialDiagnostics.failure_reasons ?? ['unknown'],
                processing_ms: partialDiagnostics.processing_ms ?? 0,
            },
        };
        await this.updateExpense(tenantId, expenseId, {
            status: expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            ocr_raw_json,
        });
        await this.redisService.recordOcrOutcome('failed');
        if (partialDiagnostics.failure_reasons?.length) {
            await this.redisService.recordOcrFailureReasons(partialDiagnostics.failure_reasons);
        }
    }
    async updateExpense(tenantId, expenseId, fields) {
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            await manager.update(expense_entity_1.Expense, expenseId, fields);
        });
    }
};
exports.OcrProcessor = OcrProcessor;
exports.OcrProcessor = OcrProcessor = OcrProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.OCR_QUEUE, { concurrency: 5 }),
    __metadata("design:paramtypes", [ocr_service_1.OcrService,
        redis_service_1.RedisService,
        receipt_processing_service_1.ReceiptProcessingService,
        typeorm_1.DataSource])
], OcrProcessor);
function classifyNetworkError(err) {
    const msg = err.message.toLowerCase();
    if (msg.includes('quota') || msg.includes('rate limit'))
        return ocr_failure_types_1.OcrFailureReason.API_QUOTA;
    if (msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('network'))
        return ocr_failure_types_1.OcrFailureReason.NETWORK_ERROR;
    if (err instanceof ocr_service_1.OcrNonRetryableError)
        return ocr_failure_types_1.OcrFailureReason.NO_TEXT_FOUND;
    return ocr_failure_types_1.OcrFailureReason.NETWORK_ERROR;
}
//# sourceMappingURL=ocr.processor.js.map