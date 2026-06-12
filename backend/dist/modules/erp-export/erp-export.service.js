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
var ErpExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpExportService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("typeorm");
const crypto = require("crypto");
const expense_entity_1 = require("../../database/entities/expense.entity");
const decimal_js_1 = require("decimal.js");
const expense_repository_1 = require("../receipt/repositories/expense.repository");
const erp_mappers_1 = require("./mappers/erp-mappers");
const webhook_service_1 = require("./webhook.service");
const redis_service_1 = require("../../common/redis/redis.service");
const queue_constants_1 = require("../queue/queue.constants");
const BATCH_RESULT_TTL = 3_600;
const ACCOUNTS = {
    1: { debit: '6422', credit: '111', description: 'Chi phí quản lý – công tác phí' },
    2: { debit: '6422', credit: '111', description: 'Chi phí quản lý – phúc lợi nhân viên' },
    3: { debit: '6422', credit: '141', description: 'Chi phí quản lý – hoàn ứng cá nhân' },
};
const KHOAN_MUC = {
    travel_allowance: { code: 'CONG_TAC_PHI', name: 'Công tác phí' },
    welfare_allowance: { code: 'PHUC_LOI_NV', name: 'Phúc lợi nhân viên' },
    personal_card_reimbursement: { code: 'HOAN_UNG', name: 'Hoàn ứng thẻ cá nhân' },
    flagged: { code: 'CAN_KIEM_TRA', name: 'Cần kiểm tra' },
};
const MISA_HEADERS = [
    'NgayHachToan', 'NgayChungTu', 'SoChungTu', 'DienGiai',
    'TKNo', 'TKCo', 'SoTien',
    'MaDoiTuong', 'TenDoiTuong',
    'MaNhaCungCap', 'TenNhaCungCap',
    'KhoanMuc', 'TenKhoanMuc',
    'SoHoaDon', 'NgayHoaDon',
    'GhiChu',
];
let ErpExportService = ErpExportService_1 = class ErpExportService {
    constructor(expenseRepo, dataSource, batchQueue, webhookService, redisService) {
        this.expenseRepo = expenseRepo;
        this.dataSource = dataSource;
        this.batchQueue = batchQueue;
        this.webhookService = webhookService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(ErpExportService_1.name);
    }
    async exportToErp(tenantId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const qb = manager.createQueryBuilder(expense_entity_1.Expense, 'e')
                .where('e.status = :status', { status: 'approved' })
                .andWhere('e.erp_exported = false')
                .andWhere("e.approval_decision = 'approved'");
            if (dto.clientId) {
                qb.andWhere('e.client_id = :clientId', { clientId: dto.clientId });
            }
            else {
                qb.andWhere('e.client_id IN (SELECT id FROM clients WHERE partner_id = :tenantId)', { tenantId });
            }
            const expenses = await qb.getMany();
            if (!expenses.length)
                throw new common_1.BadRequestException('No approved expenses ready for export');
            let payload;
            switch (dto.erpType) {
                case 'MISA':
                    payload = (0, erp_mappers_1.mapToMISA)(expenses);
                    break;
                case 'BIZZI':
                    payload = (0, erp_mappers_1.mapToBizzi)(expenses);
                    break;
                case 'SAP':
                    payload = (0, erp_mappers_1.mapToSAP)(expenses);
                    break;
                default: throw new common_1.BadRequestException('Unsupported ERP type');
            }
            await manager.createQueryBuilder()
                .update(expense_entity_1.Expense)
                .set({ erp_exported: true })
                .whereInIds(expenses.map((e) => e.id))
                .execute();
            return { success: true, exportedCount: expenses.length, erpType: dto.erpType, payload };
        });
    }
    async generateStructuredExport(tenantId, dto, options = {}) {
        const markExported = dto.mark_exported !== false;
        const fireWebhook = options.fireWebhook !== false;
        const pkg = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [partnerRow] = await manager.query(`SELECT name, branding FROM partners WHERE id = $1 LIMIT 1`, [tenantId]);
            let clientRow = null;
            if (dto.clientId) {
                [clientRow] = await manager.query(`SELECT name FROM clients WHERE id = $1 AND partner_id = $2 LIMIT 1`, [dto.clientId, tenantId]);
                if (!clientRow) {
                    throw new Error('Requested clientId not found or does not belong to this tenant.');
                }
            }
            const params = [dto.from, dto.to];
            const clientFilter = dto.clientId ? `AND e.client_id = $${params.push(dto.clientId)}` : '';
            const rows = await manager.query(`
        SELECT
          e.id,
          e.parent_expense_id,
          e.receipt_date,
          e.original_amount,
          e.final_amount_deductible,
          e.currency,
          e.gate_applied,
          e.final_category,
          e.pit_flag,
          e.erp_exported,
          e.ocr_raw_json,
          e.supporting_documents,
          emp.id            AS employee_uuid,
          emp.full_name     AS employee_name,
          emp.employee_id   AS employee_internal_id,
          c.id              AS client_uuid,
          c.name            AS client_name,
          (SELECT last_four
           FROM employee_bank_accounts
           WHERE employee_id = emp.id AND is_primary = TRUE
           LIMIT 1)         AS bank_last_four,
          (SELECT ARRAY_AGG(ec.id)
           FROM expenses ec
           WHERE ec.parent_expense_id = e.id
             AND ec.status = 'approved'
             AND ec.approval_decision = 'approved') AS child_ids
        FROM expenses e
        JOIN employees emp ON emp.id = e.employee_id
        JOIN clients   c   ON c.id   = e.client_id
        WHERE e.status = 'approved'
          AND e.approval_decision = 'approved'
          AND e.receipt_date >= $1::date
          AND e.receipt_date <  $2::date + INTERVAL '1 day'
          ${clientFilter}
        ORDER BY e.receipt_date ASC, c.name ASC
      `, params);
            if (!rows.length) {
                return this.emptyPackage(tenantId, dto, partnerRow?.name, clientRow?.name);
            }
            const expenseRecords = rows.map((r) => this.toExpenseRecord(r));
            const expenseIds = rows.map((r) => r.id);
            const commentsMap = await this.fetchCommentsMap(manager, expenseIds);
            for (const record of expenseRecords) {
                record.comments = commentsMap.get(record.id) ?? [];
            }
            const parentIds = expenseRecords.filter((r) => r.children.length > 0).map((r) => r.id);
            const splitTotals = new Map();
            if (parentIds.length > 0) {
                const splitRows = await manager.query(`SELECT parent_expense_id,
                    COALESCE(SUM(final_amount_deductible), 0) AS total_split
             FROM expenses
             WHERE parent_expense_id = ANY($1::uuid[])
               AND status = 'approved'
               AND approval_decision = 'approved'
             GROUP BY parent_expense_id`, [parentIds]);
                for (const sr of splitRows) {
                    splitTotals.set(sr.parent_expense_id, new decimal_js_1.Decimal(String(sr.total_split)).toFixed(0));
                }
            }
            const summary = this.computeSummary(expenseRecords);
            const splitGroups = this.buildSplitGroups(expenseRecords, splitTotals);
            const validation = this.buildValidationReport(expenseRecords);
            if (markExported) {
                await manager.query(`UPDATE expenses SET erp_exported = TRUE WHERE id = ANY($1::uuid[])`, [expenseIds]);
                this.logger.log(`Structured export: marked ${rows.length} expenses erp_exported (tenant=${tenantId})`);
            }
            return {
                schema_version: '2.0',
                metadata: {
                    generated_at: new Date().toISOString(),
                    period: { from: dto.from, to: dto.to },
                    tenant_name: partnerRow?.name ?? tenantId,
                    company_display_name: partnerRow?.branding?.company_display_name ?? partnerRow?.name ?? tenantId,
                    client_name: clientRow?.name ?? null,
                    logo_url: partnerRow?.branding?.logo_url ?? null,
                    expense_count: rows.length,
                    total_original_vnd: summary.total_original.toFixed(0),
                    total_deductible_vnd: summary.total_deductible.toFixed(0),
                    total_pit_applicable_vnd: summary.total_pit.toFixed(0),
                    marked_as_exported: markExported,
                },
                expenses: expenseRecords,
                summary: {
                    by_gate: summary.by_gate,
                    by_category: summary.by_category,
                    pit_summary: {
                        expenses_with_pit: summary.pit_count,
                        total_pit_amount_vnd: summary.total_pit.toFixed(0),
                    },
                    split_groups: splitGroups,
                },
                validation_report: validation,
                supporting_documents: rows
                    .flatMap((r) => (r.supporting_documents ?? []).map((d) => ({
                    expense_id: r.id,
                    ...d,
                }))),
            };
        });
        if (fireWebhook && pkg.metadata.expense_count > 0) {
            void this.webhookService.fireEvent(tenantId, 'export.completed', {
                export_format: 'structured_v2',
                expense_count: pkg.metadata.expense_count,
                total_deductible_vnd: pkg.metadata.total_deductible_vnd,
                period: pkg.metadata.period,
                marked_as_exported: pkg.metadata.marked_as_exported,
            });
        }
        return pkg;
    }
    async generateMisaCsv(tenantId, dto) {
        const pkg = await this.generateStructuredExport(tenantId, { ...dto, mark_exported: dto.mark_exported }, { fireWebhook: false });
        if (pkg.metadata.expense_count > 0) {
            void this.webhookService.fireEvent(tenantId, 'export.completed', {
                export_format: 'misa_csv',
                expense_count: pkg.metadata.expense_count,
                total_deductible_vnd: pkg.metadata.total_deductible_vnd,
                period: pkg.metadata.period,
                marked_as_exported: pkg.metadata.marked_as_exported,
            });
        }
        const displayName = pkg.metadata.company_display_name ?? pkg.metadata.tenant_name;
        const rows = [
            `# Xuất từ Reclaim! by ${displayName} | ${pkg.metadata.period.from} → ${pkg.metadata.period.to} | ${pkg.metadata.expense_count} chi phí`,
            MISA_HEADERS.join(','),
        ];
        for (const e of pkg.expenses) {
            const gate = e.gate_applied;
            const credit = gate === 3 ? '141' : '111';
            const km = KHOAN_MUC[e.category] ?? KHOAN_MUC.flagged;
            const ocr = e._ocr ?? {};
            const cols = [
                e.receipt_date,
                e.receipt_date,
                `RCL-${e.id.slice(0, 8).toUpperCase()}`,
                csvStr(`Reclaim - ${km.name}${e.vendor ? ' - ' + e.vendor : ''}`),
                '6422',
                credit,
                e.deductible_amount_vnd,
                e.employee.internal_id,
                csvStr(e.employee.name),
                '',
                csvStr(e.vendor ?? ''),
                km.code,
                km.name,
                ocr.invoice_number ?? '',
                ocr.invoice_date ?? '',
                csvStr(`Gate ${gate}${e.pit_flag ? ' | PIT' : ''}${e.parent_expense_id ? ' | SPLIT' : ''}`),
            ];
            rows.push(cols.join(','));
        }
        return rows.join('\r\n');
    }
    toExpenseRecord(r) {
        const gate = Number(r.gate_applied);
        const accounts = ACCOUNTS[gate] ?? ACCOUNTS[2];
        const origAmt = new decimal_js_1.Decimal(String(r.original_amount));
        const dedAmt = new decimal_js_1.Decimal(String(r.final_amount_deductible));
        const record = {
            id: r.id,
            parent_expense_id: r.parent_expense_id ?? null,
            children: (r.child_ids ?? []).filter(Boolean),
            receipt_date: new Date(r.receipt_date).toISOString().slice(0, 10),
            employee: {
                id: r.employee_uuid,
                name: r.employee_name ?? 'Không rõ',
                internal_id: r.employee_internal_id ?? '',
            },
            client: {
                id: r.client_uuid,
                name: r.client_name ?? '',
            },
            vendor: r.ocr_raw_json?.vendor ?? null,
            ocr_confidence: r.ocr_raw_json?.confidence ?? 0,
            original_amount_vnd: origAmt.toFixed(0),
            deductible_amount_vnd: dedAmt.toFixed(0),
            currency: r.currency ?? 'VND',
            gate_applied: gate,
            category: r.final_category,
            pit_flag: Boolean(r.pit_flag),
            already_exported: Boolean(r.erp_exported),
            supporting_documents: r.supporting_documents ?? [],
            comments: [],
            accounting: {
                debit_account: accounts.debit,
                credit_account: accounts.credit,
                description: accounts.description,
            },
        };
        if (gate === 3) {
            record.voucher = {
                voucher_number: `PV-${r.id.slice(0, 8).toUpperCase()}`,
                employee_name: r.employee_name ?? '',
                amount_vnd: dedAmt.toFixed(0),
                bank_last_four: r.bank_last_four ?? null,
            };
        }
        record._ocr = r.ocr_raw_json ?? {};
        return record;
    }
    async fetchCommentsMap(manager, expenseIds) {
        const map = new Map();
        if (!expenseIds.length)
            return map;
        const rows = await manager.query(`SELECT ec.id, ec.expense_id, ec.body, ec.created_at,
              u.email AS user_email, u.role AS user_role
       FROM expense_comments ec
       JOIN users u ON u.id = ec.user_id
       WHERE ec.expense_id = ANY($1::uuid[])
       ORDER BY ec.created_at ASC`, [expenseIds]);
        for (const row of rows) {
            const list = map.get(row.expense_id) ?? [];
            list.push({
                id: row.id,
                user_email: row.user_email ?? '',
                user_role: row.user_role ?? '',
                body: row.body,
                created_at: new Date(row.created_at).toISOString(),
            });
            map.set(row.expense_id, list);
        }
        return map;
    }
    computeSummary(records) {
        const ZERO = new decimal_js_1.Decimal(0);
        let totalOrig = ZERO, totalDed = ZERO, totalPit = ZERO, pitCount = 0;
        const byGate = {
            gate_1: { count: 0, total_deductible_vnd: '0' },
            gate_2: { count: 0, total_deductible_vnd: '0' },
            gate_3: { count: 0, total_deductible_vnd: '0' },
        };
        const byCat = {};
        for (const r of records) {
            const orig = new decimal_js_1.Decimal(r.original_amount_vnd);
            const ded = new decimal_js_1.Decimal(r.deductible_amount_vnd);
            totalOrig = totalOrig.plus(orig);
            totalDed = totalDed.plus(ded);
            if (r.pit_flag) {
                totalPit = totalPit.plus(orig.minus(ded));
                pitCount++;
            }
            const gk = `gate_${r.gate_applied}`;
            byGate[gk].count++;
            byGate[gk].total_deductible_vnd = new decimal_js_1.Decimal(byGate[gk].total_deductible_vnd)
                .plus(ded).toFixed(0);
            byCat[r.category] = (byCat[r.category] ?? 0) + 1;
        }
        return { total_original: totalOrig, total_deductible: totalDed, total_pit: totalPit,
            pit_count: pitCount, by_gate: byGate, by_category: byCat };
    }
    buildSplitGroups(records, splitTotals) {
        const parents = records.filter((r) => r.children.length > 0);
        return parents.map((p) => ({
            parent_id: p.id,
            child_ids: p.children,
            total_split: splitTotals.get(p.id) ?? '0',
        }));
    }
    buildValidationReport(records) {
        const issues = [];
        for (const e of records) {
            if (e.already_exported) {
                issues.push({
                    expense_id: e.id,
                    level: 'ERROR',
                    code: 'ALREADY_EXPORTED',
                    message: `Expense ${e.id.slice(0, 8)} was already marked erp_exported. Re-exporting may cause duplicate entries.`,
                });
            }
            if (e.currency !== 'VND') {
                issues.push({
                    expense_id: e.id,
                    level: 'ERROR',
                    code: 'FOREIGN_CURRENCY',
                    message: `Expense ${e.id.slice(0, 8)} is in ${e.currency}. Manual FX conversion required before import.`,
                });
            }
            if (e.ocr_confidence < 0.7) {
                issues.push({
                    expense_id: e.id,
                    level: 'WARN',
                    code: 'LOW_OCR_CONFIDENCE',
                    message: `Expense ${e.id.slice(0, 8)} OCR confidence ${Math.round(e.ocr_confidence * 100)}% — verify vendor and amount.`,
                });
            }
            if (!e.vendor) {
                issues.push({
                    expense_id: e.id,
                    level: 'WARN',
                    code: 'MISSING_VENDOR',
                    message: `Expense ${e.id.slice(0, 8)} has no vendor name. MISA's TenNhaCungCap will be empty.`,
                });
            }
            if (e.pit_flag) {
                issues.push({
                    expense_id: e.id,
                    level: 'WARN',
                    code: 'PIT_REVIEW_REQUIRED',
                    message: `Expense ${e.id.slice(0, 8)} triggers PIT. Include in employee PIT declaration (quyết toán thuế TNCN).`,
                });
            }
            if (e.parent_expense_id) {
                issues.push({
                    expense_id: e.id,
                    level: 'INFO',
                    code: 'SPLIT_CHILD',
                    message: `Expense ${e.id.slice(0, 8)} is a split record of parent ${e.parent_expense_id.slice(0, 8)}.`,
                });
            }
            if (e.children.length > 0) {
                issues.push({
                    expense_id: e.id,
                    level: 'INFO',
                    code: 'SPLIT_PARENT',
                    message: `Expense ${e.id.slice(0, 8)} has ${e.children.length} split child record(s).`,
                });
            }
        }
        const errorCount = issues.filter((i) => i.level === 'ERROR').length;
        const warnCount = issues.filter((i) => i.level === 'WARN').length;
        const infoCount = issues.filter((i) => i.level === 'INFO').length;
        const blockingMsgs = issues.filter((i) => i.level === 'ERROR').map((i) => i.message);
        return {
            valid: errorCount === 0,
            issues,
            total_issues: issues.length,
            error_count: errorCount,
            warning_count: warnCount,
            info_count: infoCount,
            blocking_reasons: blockingMsgs,
        };
    }
    emptyPackage(tenantId, dto, tenantName, clientName) {
        const emptyGate = { count: 0, total_deductible_vnd: '0' };
        return {
            schema_version: '2.0',
            metadata: {
                generated_at: new Date().toISOString(),
                period: { from: dto.from, to: dto.to },
                tenant_name: tenantName ?? tenantId,
                company_display_name: tenantName ?? tenantId,
                logo_url: null,
                client_name: clientName ?? null,
                expense_count: 0,
                total_original_vnd: '0',
                total_deductible_vnd: '0',
                total_pit_applicable_vnd: '0',
                marked_as_exported: false,
            },
            expenses: [],
            summary: {
                by_gate: { gate_1: emptyGate, gate_2: emptyGate, gate_3: emptyGate },
                by_category: {},
                pit_summary: { expenses_with_pit: 0, total_pit_amount_vnd: '0' },
                split_groups: [],
            },
            validation_report: {
                valid: true,
                issues: [],
                total_issues: 0,
                error_count: 0,
                warning_count: 0,
                info_count: 0,
                blocking_reasons: [],
            },
            supporting_documents: [],
        };
    }
    async startBatchExport(tenantId, dto) {
        const jobId = crypto.randomUUID();
        const redisKey = `batch_export:${jobId}`;
        await this.redisService.cacheSet(redisKey, JSON.stringify({
            status: 'queued',
            tenant_id: tenantId,
            job_id: jobId,
            queued_at: new Date().toISOString(),
        }), BATCH_RESULT_TTL);
        await this.batchQueue.add('export', { tenantId, jobId, dto });
        this.logger.log(`Batch export queued: jobId=${jobId} tenant=${tenantId}`);
        return { jobId, status: 'queued' };
    }
    async getBatchExportStatus(tenantId, jobId) {
        const raw = await this.redisService.cacheGet(`batch_export:${jobId}`);
        if (!raw)
            return null;
        const state = JSON.parse(raw);
        if (state.tenant_id !== tenantId)
            return null;
        return state;
    }
};
exports.ErpExportService = ErpExportService;
exports.ErpExportService = ErpExportService = ErpExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)(queue_constants_1.BATCH_EXPORT_QUEUE)),
    __metadata("design:paramtypes", [expense_repository_1.ExpenseRepository,
        typeorm_1.DataSource,
        bullmq_2.Queue,
        webhook_service_1.WebhookService,
        redis_service_1.RedisService])
], ErpExportService);
function csvStr(s) {
    const escaped = String(s ?? '').replace(/"/g, '""');
    return `"${escaped}"`;
}
//# sourceMappingURL=erp-export.service.js.map