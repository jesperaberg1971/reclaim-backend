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
var HitlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitlService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const receipt_processing_service_1 = require("../receipt/receipt-processing.service");
const redis_service_1 = require("../../common/redis/redis.service");
const audit_service_1 = require("../../common/audit/audit.service");
const signed_url_service_1 = require("../../common/storage/signed-url.service");
const bulk_action_dto_1 = require("./dto/bulk-action.dto");
const expense_entity_1 = require("../../database/entities/expense.entity");
let HitlService = HitlService_1 = class HitlService {
    constructor(dataSource, receiptProcessingService, redisService, auditService, signedUrlService) {
        this.dataSource = dataSource;
        this.receiptProcessingService = receiptProcessingService;
        this.redisService = redisService;
        this.auditService = auditService;
        this.signedUrlService = signedUrlService;
        this.logger = new common_1.Logger(HitlService_1.name);
    }
    async getQueue(tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const rows = await manager.query(`
        SELECT
          e.id,
          e.receipt_date,
          e.original_amount,
          e.ocr_raw_json,
          e.created_at,
          emp.full_name   AS employee_name,
          c.name          AS client_name
        FROM expenses e
        LEFT JOIN employees emp ON emp.id = e.employee_id
        LEFT JOIN clients   c   ON c.id   = e.client_id
        WHERE e.status = $1
        ORDER BY e.created_at ASC
      `, [expense_entity_1.ExpenseStatus.NEEDS_REVIEW]);
            return rows.map((r) => ({
                id: r.id,
                receipt_date: r.receipt_date,
                original_amount: new decimal_js_1.Decimal(String(r.original_amount)),
                vendor: r.ocr_raw_json?.vendor ?? null,
                ocr_confidence: r.ocr_raw_json?.confidence ?? 0,
                failure_reasons: r.ocr_raw_json?.diagnostics?.failure_reasons ?? [],
                created_at: r.created_at,
                employee_name: r.employee_name,
                client_name: r.client_name,
            }));
        });
    }
    async getDetail(expenseId, tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`
        SELECT
          e.id,
          e.receipt_date,
          e.original_amount,
          e.ocr_raw_json,
          e.status,
          e.gate_applied,
          e.supporting_documents,
          e.receipt_image_url,
          e.created_at,
          emp.full_name   AS employee_name,
          emp.employee_id AS employee_internal_id,
          c.name          AS client_name
        FROM expenses e
        LEFT JOIN employees emp ON emp.id = e.employee_id
        LEFT JOIN clients   c   ON c.id   = e.client_id
        WHERE e.id = $1
        LIMIT 1
      `, [expenseId]);
            if (!row)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            const rawImageUrl = row.receipt_image_url ?? null;
            const rawDocs = row.supporting_documents ?? [];
            const [signedImageUrl, signedDocs] = await Promise.all([
                rawImageUrl ? this.signedUrlService.getSignedUrl(rawImageUrl) : Promise.resolve(null),
                Promise.all(rawDocs.map(async (doc) => {
                    if (!doc.url)
                        return doc;
                    const signedUrl = await this.signedUrlService.getSignedUrl(doc.url);
                    return signedUrl !== doc.url ? { ...doc, signed_url: signedUrl } : doc;
                })),
            ]);
            return {
                id: row.id,
                receipt_date: row.receipt_date,
                original_amount: new decimal_js_1.Decimal(String(row.original_amount)),
                vendor: row.ocr_raw_json?.vendor ?? null,
                ocr_confidence: row.ocr_raw_json?.confidence ?? 0,
                failure_reasons: row.ocr_raw_json?.diagnostics?.failure_reasons ?? [],
                ocr_raw_json: row.ocr_raw_json,
                status: row.status,
                gate_applied: Number(row.gate_applied ?? 0),
                supporting_documents: signedDocs,
                receipt_image_url: rawImageUrl,
                receipt_image_signed_url: signedImageUrl,
                already_processed: row.status !== expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
                created_at: row.created_at,
                employee_name: row.employee_name,
                employee_internal_id: row.employee_internal_id,
                client_name: row.client_name,
            };
        });
    }
    async applyCorrection(expenseId, tenantId, dto, userId, ipAddress) {
        this.logger.log(`HITL correction applied to expense ${expenseId}`);
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [exp] = await manager.query(`SELECT id, ocr_raw_json, original_amount FROM expenses WHERE id = $1`, [expenseId]);
            if (!exp)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            const correctedOcr = {
                ...exp.ocr_raw_json,
                ...(dto.vendor !== undefined ? { vendor: dto.vendor } : {}),
                ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
                ...(dto.date !== undefined ? { date: dto.date } : {}),
                ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
                human_reviewed: true,
                reviewer_notes: dto.reviewer_notes ?? null,
                reviewed_at: new Date().toISOString(),
                original_ocr: exp.ocr_raw_json.original_ocr ?? { ...exp.ocr_raw_json },
            };
            await manager.query(`
        UPDATE expenses
        SET
          ocr_raw_json    = $1,
          original_amount = COALESCE($2, original_amount),
          receipt_date    = COALESCE($3::timestamptz, receipt_date),
          status          = $4
        WHERE id = $5
      `, [
                JSON.stringify(correctedOcr),
                dto.amount !== undefined ? new decimal_js_1.Decimal(String(dto.amount)).toFixed(4) : null,
                dto.date !== undefined ? dto.date : null,
                expense_entity_1.ExpenseStatus.COMPLETE,
                expenseId,
            ]);
        });
        const decision = await this.receiptProcessingService.processExpense(expenseId, tenantId);
        this.logger.log(`HITL re-process complete: expense ${expenseId} → Gate ${decision.gate} | ${decision.status}`);
        void this.auditService.log({
            tenantId, userId, ipAddress,
            action: 'hitl_correction',
            resourceType: 'expense',
            resourceId: expenseId,
            metadata: { gate: decision.gate, status: decision.status, reviewer_notes: dto.reviewer_notes },
        });
        return {
            expenseId,
            gate: decision.gate,
            category: decision.finalCategory,
            status: decision.status,
            deductible_vnd: decision.finalAmountDeductible.toFixed(0),
            pit_flag: decision.pitFlag,
            reason: decision.reason,
        };
    }
    async rejectExpense(expenseId, tenantId, reason, userId, ipAddress) {
        this.logger.log(`HITL rejection applied to expense ${expenseId}`);
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [exp] = await manager.query(`SELECT id, ocr_raw_json FROM expenses WHERE id = $1`, [expenseId]);
            if (!exp)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            const updatedOcr = {
                ...exp.ocr_raw_json,
                human_reviewed: true,
                reviewer_notes: reason ?? null,
                reviewed_at: new Date().toISOString(),
                rejected: true,
            };
            await manager.query(`UPDATE expenses
         SET status = $1, ocr_raw_json = $2, approval_decision = 'rejected'
         WHERE id = $3`, [expense_entity_1.ExpenseStatus.REJECTED, JSON.stringify(updatedOcr), expenseId]);
        });
        void this.auditService.log({
            tenantId, userId, ipAddress,
            action: 'hitl_reject',
            resourceType: 'expense',
            resourceId: expenseId,
            metadata: { reason },
        });
    }
    async bulkAction(expenseIds, action, tenantId, reviewerNotes, userId, ipAddress) {
        const succeeded = [];
        const failed = [];
        for (const id of expenseIds) {
            try {
                if (action === bulk_action_dto_1.BulkActionType.APPROVE) {
                    await this.bulkApproveOne(id, tenantId, reviewerNotes);
                }
                else {
                    await this.rejectExpense(id, tenantId, reviewerNotes);
                }
                succeeded.push(id);
            }
            catch (e) {
                failed.push({ id, error: e.message });
            }
        }
        this.logger.log(`Bulk ${action}: ${succeeded.length} succeeded, ${failed.length} failed out of ${expenseIds.length}`);
        void this.auditService.log({
            tenantId, userId, ipAddress,
            action: 'hitl_bulk_action',
            metadata: { action, succeeded_count: succeeded.length, failed_count: failed.length, reviewer_notes: reviewerNotes },
        });
        return { succeeded, failed };
    }
    async bulkApproveOne(expenseId, tenantId, reviewerNotes) {
        const row = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [r] = await manager.query(`SELECT e.gate_applied, e.original_amount, e.ocr_raw_json
         FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE e.id = $1 AND c.partner_id = $2
         LIMIT 1`, [expenseId, tenantId]);
            return r ?? null;
        });
        if (!row)
            throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
        const gateAlreadyApplied = Number(row.gate_applied) > 0;
        const hasAmount = Number(row.original_amount) > 0;
        if (gateAlreadyApplied && hasAmount) {
            await this.dataSource.transaction(async (manager) => {
                await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
                const updatedOcr = {
                    ...row.ocr_raw_json,
                    human_reviewed: true,
                    reviewer_notes: reviewerNotes ?? null,
                    reviewed_at: new Date().toISOString(),
                };
                await manager.query(`UPDATE expenses SET status = $1, ocr_raw_json = $2 WHERE id = $3`, [expense_entity_1.ExpenseStatus.APPROVED, JSON.stringify(updatedOcr), expenseId]);
            });
        }
        else {
            await this.applyCorrection(expenseId, tenantId, { reviewer_notes: reviewerNotes });
        }
    }
    async getOcrMetrics(period) {
        return this.redisService.getOcrMetrics(period);
    }
};
exports.HitlService = HitlService;
exports.HitlService = HitlService = HitlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        receipt_processing_service_1.ReceiptProcessingService,
        redis_service_1.RedisService,
        audit_service_1.AuditService,
        signed_url_service_1.SignedUrlService])
], HitlService);
//# sourceMappingURL=hitl.service.js.map