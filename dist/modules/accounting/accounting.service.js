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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const fs = require("fs");
const path = require("path");
const fflate_1 = require("fflate");
const storage_1 = require("@google-cloud/storage");
const notifications_service_1 = require("../notifications/notifications.service");
const redis_service_1 = require("../../common/redis/redis.service");
const DASHBOARD_CACHE_TTL = 120;
const EXPORTS_CACHE_TTL = 300;
const ANALYTICS_CACHE_TTL = 300;
const CATEGORY_LABELS = {
    travel_allowance: 'Công tác phí (Gate 1)',
    welfare_allowance: 'Phúc lợi nhân viên (Gate 2)',
    personal_card_reimbursement: 'Chi hộ cá nhân (Gate 3)',
    flagged: 'Bị gắn cờ',
};
const GATE_LABELS = {
    1: { name: 'Gate 1 — Công tác phí', code: 'travel_allowance', debit: '6422', credit: '111' },
    2: { name: 'Gate 2 — Phúc lợi nhân viên', code: 'welfare_allowance', debit: '6422', credit: '111' },
    3: { name: 'Gate 3 — Chi hộ cá nhân', code: 'personal_card_reimbursement', debit: '6422', credit: '141' },
};
const GATE_EXPLAIN = {
    1: 'Biên lai phát sinh trong chuyến công tác đã được phê duyệt. Khoản được khấu trừ theo phụ cấp công tác hàng ngày.',
    2: 'Khoản phúc lợi nhân viên hàng tháng (ăn uống, nghỉ dưỡng). Phần vượt mức được đánh dấu PIT.',
    3: 'Nhân viên thanh toán bằng thẻ cá nhân và được hoàn ứng. Phiếu chi được tạo tự động.',
};
let AccountingService = class AccountingService {
    constructor(dataSource, notificationsService, redisService) {
        this.dataSource = dataSource;
        this.notificationsService = notificationsService;
        this.redisService = redisService;
    }
    async listExpenses(tenantId, filters) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const conditions = [`e.status IN ('approved','erp_exported','rejected')`];
            const params = [];
            let p = 1;
            if (filters.from) {
                conditions.push(`e.receipt_date::date >= $${p++}`);
                params.push(filters.from);
            }
            if (filters.to) {
                conditions.push(`e.receipt_date::date <= $${p++}`);
                params.push(filters.to);
            }
            if (filters.clientId) {
                conditions.push(`e.client_id = $${p++}`);
                params.push(filters.clientId);
            }
            if (filters.employeeId) {
                conditions.push(`e.employee_id = $${p++}`);
                params.push(filters.employeeId);
            }
            if (filters.gate) {
                conditions.push(`e.gate_applied = $${p++}`);
                params.push(filters.gate);
            }
            if (filters.status === 'pending_export') {
                conditions.push(`e.erp_exported = false`);
            }
            else if (filters.status === 'exported') {
                conditions.push(`e.erp_exported = true`);
            }
            if (filters.approvalDecision === 'pending') {
                conditions.push(`e.approval_decision IS NULL`);
            }
            else if (filters.approvalDecision === 'approved') {
                conditions.push(`e.approval_decision = 'approved'`);
            }
            else if (filters.approvalDecision === 'rejected') {
                conditions.push(`e.approval_decision = 'rejected'`);
            }
            if (filters.search) {
                conditions.push(`(LOWER(emp.full_name) LIKE $${p} OR LOWER(e.ocr_raw_json->>'vendor') LIKE $${p})`);
                params.push(`%${filters.search.toLowerCase()}%`);
                p++;
            }
            const where = conditions.join(' AND ');
            const countJoin = `FROM expenses e
        JOIN employees emp ON emp.id = e.employee_id
        JOIN clients   c   ON c.id   = e.client_id
        WHERE ${where}`;
            const [{ count }] = await manager.query(`SELECT COUNT(*) AS count ${countJoin}`, params);
            const page = Math.max(1, filters.page ?? 1);
            const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
            const offset = (page - 1) * limit;
            const rows = await manager.query(`
        SELECT
          e.id,
          e.receipt_date,
          e.original_amount,
          e.final_amount_deductible,
          e.currency,
          e.gate_applied,
          e.final_category,
          e.pit_flag,
          e.erp_exported,
          e.status,
          e.supporting_documents,
          e.ocr_raw_json,
          e.accountant_reviewed_at,
          e.reviewer_note,
          e.approval_decision,
          e.parent_expense_id,
          (SELECT COUNT(*) FROM expenses WHERE parent_expense_id = e.id)::int AS split_child_count,
          emp.full_name       AS employee_name,
          emp.employee_id     AS employee_internal_id,
          c.id                AS client_id,
          c.name              AS client_name
        FROM expenses e
        JOIN employees emp ON emp.id = e.employee_id
        JOIN clients   c   ON c.id   = e.client_id
        WHERE ${where}
        ORDER BY e.receipt_date DESC, e.created_at DESC
        LIMIT $${p} OFFSET $${p + 1}
      `, [...params, limit, offset]);
            const total = Number(count);
            return {
                data: rows.map((r) => this.toExpense(r)),
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    async getExpenseDetail(expenseId, tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [r] = await manager.query(`
        SELECT
          e.id, e.receipt_date, e.original_amount, e.final_amount_deductible,
          e.currency, e.gate_applied, e.final_category, e.pit_flag,
          e.erp_exported, e.status, e.supporting_documents, e.ocr_raw_json,
          e.accountant_reviewed_at, e.reviewer_note, e.approval_decision,
          e.parent_expense_id,
          (SELECT ARRAY_AGG(ec.id) FROM expenses ec WHERE ec.parent_expense_id = e.id) AS child_ids,
          emp.full_name       AS employee_name,
          emp.employee_id     AS employee_internal_id,
          c.id                AS client_id,
          c.name              AS client_name,
          (SELECT last_four FROM employee_bank_accounts
           WHERE employee_id = emp.id AND is_primary = TRUE LIMIT 1) AS bank_last_four
        FROM expenses e
        JOIN employees emp ON emp.id = e.employee_id
        JOIN clients   c   ON c.id   = e.client_id
        WHERE e.id = $1
          AND c.partner_id = $2
        LIMIT 1
      `, [expenseId, tenantId]);
            if (!r)
                throw new Error(`Expense ${expenseId} not found`);
            const base = this.toExpense(r);
            const gate = Number(r.gate_applied);
            const meta = GATE_LABELS[gate] ?? GATE_LABELS[2];
            let tripDecision = null;
            if (gate === 1) {
                const [td] = await manager.query(`
          SELECT start_date, end_date, destination, daily_allowance_amount
          FROM trip_decisions
          WHERE employee_id = (SELECT employee_id FROM expenses WHERE id = $1)
            AND status = 'approved'
            AND $2::date BETWEEN start_date AND end_date
          LIMIT 1
        `, [expenseId, r.receipt_date]);
                if (td) {
                    tripDecision = {
                        start_date: new Date(td.start_date).toISOString().slice(0, 10),
                        end_date: new Date(td.end_date).toISOString().slice(0, 10),
                        destination: td.destination ?? null,
                        daily_allowance_vnd: new decimal_js_1.Decimal(String(td.daily_allowance_amount)).toFixed(0),
                    };
                }
            }
            const voucher = gate === 3 ? {
                voucher_number: `PV-${r.id.slice(0, 8).toUpperCase()}`,
                amount_vnd: new decimal_js_1.Decimal(String(r.final_amount_deductible)).toFixed(0),
                bank_last_four: r.bank_last_four ?? null,
            } : null;
            return {
                ...base,
                gate_explanation: GATE_EXPLAIN[gate] ?? '',
                accounting_debit: meta.debit,
                accounting_credit: meta.credit,
                ocr_vendor: r.ocr_raw_json?.vendor ?? null,
                ocr_confidence: r.ocr_raw_json?.confidence ?? 0,
                child_ids: (r.child_ids ?? []).filter(Boolean),
                voucher,
                trip_decision: tripDecision,
            };
        });
    }
    async listClients(tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT id, name FROM clients ORDER BY name`);
        });
    }
    async getPeriodSummary(tenantId, from, to, clientId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const params = [from, to];
            const clientFilter = clientId ? `AND e.client_id = $${params.push(clientId)}` : '';
            const [row] = await manager.query(`
        SELECT
          COUNT(*)                                                                        AS expense_count,
          COALESCE(SUM(e.original_amount), 0)                                            AS total_original,
          COALESCE(SUM(e.final_amount_deductible), 0)                                    AS total_deductible,
          COALESCE(SUM(CASE WHEN e.pit_flag THEN e.original_amount - e.final_amount_deductible ELSE 0 END), 0)
                                                                                          AS total_pit,
          COUNT(*) FILTER (WHERE e.erp_exported = FALSE)                                 AS pending_export_count,
          COUNT(*) FILTER (WHERE e.erp_exported = TRUE)                                  AS exported_count,
          COALESCE(SUM(CASE WHEN e.gate_applied = 1 THEN e.final_amount_deductible ELSE 0 END), 0) AS gate1_ded,
          COUNT(*)          FILTER (WHERE e.gate_applied = 1)                            AS gate1_count,
          COALESCE(SUM(CASE WHEN e.gate_applied = 2 THEN e.final_amount_deductible ELSE 0 END), 0) AS gate2_ded,
          COUNT(*)          FILTER (WHERE e.gate_applied = 2)                            AS gate2_count,
          COALESCE(SUM(CASE WHEN e.gate_applied = 3 THEN e.final_amount_deductible ELSE 0 END), 0) AS gate3_ded,
          COUNT(*)          FILTER (WHERE e.gate_applied = 3)                            AS gate3_count
        FROM expenses e
        JOIN clients c ON c.id = e.client_id
        WHERE e.status IN ('approved', 'erp_exported')
          AND e.receipt_date::date BETWEEN $1 AND $2
          ${clientFilter}
      `, params);
            return {
                expense_count: Number(row.expense_count),
                total_original_vnd: new decimal_js_1.Decimal(row.total_original).toFixed(0),
                total_deductible_vnd: new decimal_js_1.Decimal(row.total_deductible).toFixed(0),
                total_pit_vnd: new decimal_js_1.Decimal(row.total_pit).toFixed(0),
                pending_export_count: Number(row.pending_export_count),
                exported_count: Number(row.exported_count),
                by_gate: {
                    gate_1: { count: Number(row.gate1_count), deductible_vnd: new decimal_js_1.Decimal(row.gate1_ded).toFixed(0) },
                    gate_2: { count: Number(row.gate2_count), deductible_vnd: new decimal_js_1.Decimal(row.gate2_ded).toFixed(0) },
                    gate_3: { count: Number(row.gate3_count), deductible_vnd: new decimal_js_1.Decimal(row.gate3_ded).toFixed(0) },
                },
            };
        });
    }
    toExpense(r) {
        const gate = Number(r.gate_applied);
        const meta = GATE_LABELS[gate] ?? GATE_LABELS[2];
        const docs = r.supporting_documents ?? [];
        return {
            id: r.id,
            receipt_date: new Date(r.receipt_date).toISOString().slice(0, 10),
            employee_name: r.employee_name ?? '—',
            employee_internal_id: r.employee_internal_id ?? '',
            client_id: r.client_id,
            client_name: r.client_name ?? '—',
            vendor: r.ocr_raw_json?.vendor ?? null,
            gate_applied: gate,
            gate_label: meta.name,
            original_amount_vnd: new decimal_js_1.Decimal(String(r.original_amount)).toFixed(0),
            deductible_amount_vnd: new decimal_js_1.Decimal(String(r.final_amount_deductible)).toFixed(0),
            currency: r.currency ?? 'VND',
            pit_flag: Boolean(r.pit_flag),
            erp_exported: Boolean(r.erp_exported),
            status: r.status,
            supporting_documents: docs,
            has_voucher: gate === 3,
            accountant_reviewed_at: r.accountant_reviewed_at
                ? new Date(r.accountant_reviewed_at).toISOString()
                : null,
            reviewer_note: r.reviewer_note ?? null,
            approval_decision: r.approval_decision ?? null,
            parent_expense_id: r.parent_expense_id ?? null,
            split_child_count: Number(r.split_child_count ?? 0),
        };
    }
    async listEmployees(tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT emp.id, emp.full_name AS name, emp.employee_id
         FROM employees emp
         JOIN clients c ON c.id = emp.client_id
         WHERE c.partner_id = $1
         ORDER BY emp.full_name`, [tenantId]);
        });
    }
    async unmarkReviewed(expenseId, tenantId) {
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`SELECT e.id FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE e.id = $1 AND c.partner_id = $2
         LIMIT 1`, [expenseId, tenantId]);
            if (!row)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            await manager.query(`UPDATE expenses
         SET accountant_reviewed_at = NULL,
             accountant_reviewed_by = NULL,
             reviewer_note          = NULL,
             status = CASE WHEN approval_decision = 'rejected' THEN 'approved' ELSE status END,
             approval_decision      = NULL
         WHERE id = $1`, [expenseId]);
            await manager.query(`UPDATE expense_approval_steps
         SET status = 'pending', decided_by = NULL, decided_at = NULL, note = NULL
         WHERE expense_id = $1 AND step_type = 'accountant'`, [expenseId]);
        });
    }
    async markReviewed(expenseId, tenantId, userId, note) {
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`SELECT e.id FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE e.id = $1 AND c.partner_id = $2
         LIMIT 1`, [expenseId, tenantId]);
            if (!row)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            const [pendingManager] = await manager.query(`SELECT id FROM expense_approval_steps
         WHERE expense_id = $1 AND step_type = 'manager' AND status = 'pending'`, [expenseId]);
            if (pendingManager) {
                throw new common_1.ConflictException('Manager approval is still pending for this expense');
            }
            await manager.query(`UPDATE expenses
         SET accountant_reviewed_at = NOW(),
             accountant_reviewed_by = $1,
             reviewer_note          = $2,
             approval_decision      = 'approved',
             status = CASE WHEN status = 'rejected' THEN 'approved' ELSE status END
         WHERE id = $3`, [userId, note ?? null, expenseId]);
            await manager.query(`UPDATE expense_approval_steps
         SET status = 'approved', decided_by = $1, decided_at = NOW(), note = $2
         WHERE expense_id = $3 AND step_type = 'accountant' AND status = 'pending'`, [userId, note ?? null, expenseId]);
        });
        void this.notificationsService.notifyExpenseDecision(expenseId, tenantId, 'approved', note);
    }
    async getDashboardMetrics(tenantId, from, to) {
        const cacheKey = `cache:dashboard:${tenantId}:${from}:${to}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const metrics = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [pendingRow] = await manager.query(`
        SELECT COUNT(*) AS total_pending
        FROM expenses e
        JOIN clients c ON c.id = e.client_id
        WHERE e.status = 'approved'
          AND e.approval_decision IS NULL
      `);
            const clientRows = await manager.query(`
        SELECT
          c.id   AS client_id,
          c.name AS client_name,
          COUNT(*) FILTER (WHERE e.status = 'approved' AND e.approval_decision IS NULL)                   AS pending,
          COUNT(*) FILTER (WHERE e.approval_decision = 'approved' AND e.erp_exported = FALSE)             AS approved,
          COUNT(*) FILTER (WHERE e.approval_decision = 'rejected')                                        AS rejected,
          COUNT(*) FILTER (WHERE e.erp_exported = TRUE)                                                   AS exported
        FROM expenses e
        JOIN clients c ON c.id = e.client_id
        WHERE e.status IN ('approved','erp_exported','rejected')
          AND e.receipt_date::date BETWEEN $1 AND $2
        GROUP BY c.id, c.name
        ORDER BY (COUNT(*) FILTER (WHERE e.status = 'approved' AND e.approval_decision IS NULL)) DESC, c.name ASC
      `, [from, to]);
            return {
                period: { from, to },
                pending_approval: Number(pendingRow.total_pending),
                approved_ready_to_export: clientRows.reduce((s, r) => s + Number(r.approved), 0),
                exported_this_period: clientRows.reduce((s, r) => s + Number(r.exported), 0),
                rejected_this_period: clientRows.reduce((s, r) => s + Number(r.rejected), 0),
                total_clients_active: clientRows.length,
                client_summary: clientRows.map((r) => ({
                    client_id: r.client_id,
                    client_name: r.client_name,
                    pending: Number(r.pending),
                    approved: Number(r.approved),
                    rejected: Number(r.rejected),
                    exported: Number(r.exported),
                })),
            };
        });
        await this.redisService.cacheSet(cacheKey, JSON.stringify(metrics), DASHBOARD_CACHE_TTL);
        return metrics;
    }
    async getRecentExports(tenantId, limit = 5) {
        const cacheKey = `cache:recent_exports:${tenantId}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const rows = await this.dataSource.query(`
      SELECT action, metadata, created_at
      FROM audit_logs
      WHERE tenant_id = $1
        AND action IN ('erp_export', 'accounting_export', 'misa_csv_export')
      ORDER BY created_at DESC
      LIMIT $2
    `, [tenantId, limit]);
        const result = rows.map((r) => ({
            action: r.action,
            metadata: r.metadata ?? null,
            created_at: new Date(r.created_at).toISOString(),
        }));
        await this.redisService.cacheSet(cacheKey, JSON.stringify(result), EXPORTS_CACHE_TTL);
        return result;
    }
    async rejectExpense(expenseId, tenantId, userId, note) {
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`SELECT e.id FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE e.id = $1 AND c.partner_id = $2
         LIMIT 1`, [expenseId, tenantId]);
            if (!row)
                throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
            const [pendingManager] = await manager.query(`SELECT id FROM expense_approval_steps
         WHERE expense_id = $1 AND step_type = 'manager' AND status = 'pending'`, [expenseId]);
            if (pendingManager) {
                throw new common_1.ConflictException('Manager approval is still pending for this expense');
            }
            await manager.query(`UPDATE expenses
         SET accountant_reviewed_at = NOW(),
             accountant_reviewed_by = $1,
             reviewer_note          = $2,
             approval_decision      = 'rejected',
             status                 = 'rejected'
         WHERE id = $3`, [userId, note ?? null, expenseId]);
            await manager.query(`UPDATE expense_approval_steps
         SET status = 'rejected', decided_by = $1, decided_at = NOW(), note = $2
         WHERE expense_id = $3 AND step_type = 'accountant' AND status = 'pending'`, [userId, note ?? null, expenseId]);
            await manager.query(`UPDATE expense_approval_steps SET status = 'skipped'
         WHERE expense_id = $1 AND status = 'pending'`, [expenseId]);
        });
        void this.notificationsService.notifyExpenseDecision(expenseId, tenantId, 'rejected', note);
    }
    async getSpendingBreakdown(tenantId, from, to, groupBy = 'category', clientId) {
        const cacheKey = `cache:spending:${tenantId}:${from}:${to}:${groupBy}:${clientId ?? ''}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const params = [from, to];
            const clientFilter = clientId ? `AND e.client_id = $${params.push(clientId)}` : '';
            const baseWhere = `
        WHERE e.status IN ('approved', 'erp_exported')
          AND e.receipt_date::date BETWEEN $1 AND $2
          ${clientFilter}
      `;
            let rows;
            if (groupBy === 'category') {
                rows = await manager.query(`
          SELECT e.final_category AS group_key,
            COUNT(*) AS expense_count,
            COALESCE(SUM(e.original_amount), 0) AS total_original,
            COALESCE(SUM(e.final_amount_deductible), 0) AS total_deductible,
            COALESCE(SUM(CASE WHEN e.pit_flag THEN e.original_amount - e.final_amount_deductible ELSE 0 END), 0) AS total_pit
          FROM expenses e JOIN clients c ON c.id = e.client_id
          ${baseWhere} GROUP BY e.final_category ORDER BY total_original DESC
        `, params);
            }
            else if (groupBy === 'employee') {
                rows = await manager.query(`
          SELECT emp.id AS group_key, emp.full_name AS group_name, emp.employee_id AS employee_code,
            COUNT(*) AS expense_count,
            COALESCE(SUM(e.original_amount), 0) AS total_original,
            COALESCE(SUM(e.final_amount_deductible), 0) AS total_deductible,
            COALESCE(SUM(CASE WHEN e.pit_flag THEN e.original_amount - e.final_amount_deductible ELSE 0 END), 0) AS total_pit
          FROM expenses e JOIN clients c ON c.id = e.client_id JOIN employees emp ON emp.id = e.employee_id
          ${baseWhere} GROUP BY emp.id, emp.full_name, emp.employee_id ORDER BY total_original DESC
        `, params);
            }
            else if (groupBy === 'gate') {
                rows = await manager.query(`
          SELECT e.gate_applied::text AS group_key,
            COUNT(*) AS expense_count,
            COALESCE(SUM(e.original_amount), 0) AS total_original,
            COALESCE(SUM(e.final_amount_deductible), 0) AS total_deductible,
            COALESCE(SUM(CASE WHEN e.pit_flag THEN e.original_amount - e.final_amount_deductible ELSE 0 END), 0) AS total_pit
          FROM expenses e JOIN clients c ON c.id = e.client_id
          ${baseWhere} GROUP BY e.gate_applied ORDER BY e.gate_applied ASC
        `, params);
            }
            else {
                rows = await manager.query(`
          SELECT TO_CHAR(DATE_TRUNC('month', e.receipt_date), 'YYYY-MM') AS group_key,
            COUNT(*) AS expense_count,
            COALESCE(SUM(e.original_amount), 0) AS total_original,
            COALESCE(SUM(e.final_amount_deductible), 0) AS total_deductible,
            COALESCE(SUM(CASE WHEN e.pit_flag THEN e.original_amount - e.final_amount_deductible ELSE 0 END), 0) AS total_pit
          FROM expenses e JOIN clients c ON c.id = e.client_id
          ${baseWhere} GROUP BY DATE_TRUNC('month', e.receipt_date) ORDER BY DATE_TRUNC('month', e.receipt_date) ASC
        `, params);
            }
            const grandTotal = rows.reduce((s, r) => s.add(new decimal_js_1.Decimal(r.total_original)), new decimal_js_1.Decimal(0));
            const spendingRows = rows.map((r) => {
                const orig = new decimal_js_1.Decimal(r.total_original);
                return {
                    group_key: r.group_key,
                    group_label: resolveGroupLabel(groupBy, r),
                    expense_count: Number(r.expense_count),
                    total_original_vnd: orig.toFixed(0),
                    total_deductible_vnd: new decimal_js_1.Decimal(r.total_deductible).toFixed(0),
                    total_pit_vnd: new decimal_js_1.Decimal(r.total_pit).toFixed(0),
                    percentage_of_total: grandTotal.isZero()
                        ? 0
                        : orig.div(grandTotal).mul(100).toDecimalPlaces(1).toNumber(),
                };
            });
            return {
                group_by: groupBy,
                from,
                to,
                rows: spendingRows,
                totals: {
                    expense_count: rows.reduce((s, r) => s + Number(r.expense_count), 0),
                    total_original_vnd: grandTotal.toFixed(0),
                    total_deductible_vnd: rows
                        .reduce((s, r) => s.add(new decimal_js_1.Decimal(r.total_deductible)), new decimal_js_1.Decimal(0))
                        .toFixed(0),
                },
            };
        });
        await this.redisService.cacheSet(cacheKey, JSON.stringify(result), ANALYTICS_CACHE_TTL);
        return result;
    }
    async getGatePerformance(tenantId, from, to, clientId) {
        const cacheKey = `cache:gate_perf:${tenantId}:${from}:${to}:${clientId ?? ''}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const params = [from, to];
            const clientFilter = clientId ? `AND e.client_id = $${params.push(clientId)}` : '';
            const rows = await manager.query(`
        SELECT
          e.gate_applied,
          COUNT(DISTINCT e.id) AS expense_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.approval_decision = 'approved') AS approved_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.approval_decision = 'rejected') AS rejected_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'approved' AND e.approval_decision IS NULL) AS pending_count,
          COUNT(eas.id) FILTER (WHERE eas.is_escalated = true) AS escalated_steps,
          COUNT(eas.id) AS total_steps,
          AVG(CASE WHEN e.accountant_reviewed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (e.accountant_reviewed_at - e.created_at)) / 3600.0
            ELSE NULL END) AS avg_processing_hours
        FROM expenses e
        JOIN clients c ON c.id = e.client_id
        LEFT JOIN expense_approval_steps eas ON eas.expense_id = e.id
        WHERE e.receipt_date::date BETWEEN $1 AND $2 ${clientFilter}
        GROUP BY e.gate_applied ORDER BY e.gate_applied ASC
      `, params);
            let portfolioApproved = 0;
            let portfolioRejected = 0;
            let weightedHoursSum = 0;
            let weightedHoursCount = 0;
            const gates = rows.map((r) => {
                const count = Number(r.expense_count);
                const approved = Number(r.approved_count);
                const rejected = Number(r.rejected_count);
                const decided = approved + rejected;
                const totalSteps = Number(r.total_steps);
                const escalated = Number(r.escalated_steps);
                const avgHours = r.avg_processing_hours != null
                    ? Math.round(Number(r.avg_processing_hours) * 10) / 10
                    : null;
                portfolioApproved += approved;
                portfolioRejected += rejected;
                if (avgHours != null) {
                    weightedHoursSum += avgHours * count;
                    weightedHoursCount += count;
                }
                return {
                    gate: Number(r.gate_applied),
                    gate_label: GATE_LABELS[Number(r.gate_applied)]?.name ?? `Gate ${r.gate_applied}`,
                    expense_count: count,
                    approved_count: approved,
                    rejected_count: rejected,
                    pending_count: Number(r.pending_count),
                    approval_rate: decided === 0 ? 0 : Number((approved / decided).toFixed(4)),
                    rejection_rate: decided === 0 ? 0 : Number((rejected / decided).toFixed(4)),
                    escalation_rate: totalSteps === 0 ? 0 : Number((escalated / totalSteps).toFixed(4)),
                    avg_processing_hours: avgHours,
                };
            });
            const totalDecided = portfolioApproved + portfolioRejected;
            return {
                from,
                to,
                gates,
                overall: {
                    total_expenses: gates.reduce((s, g) => s + g.expense_count, 0),
                    overall_approval_rate: totalDecided === 0 ? 0 : Number((portfolioApproved / totalDecided).toFixed(4)),
                    overall_avg_processing_hours: weightedHoursCount === 0
                        ? null
                        : Math.round((weightedHoursSum / weightedHoursCount) * 10) / 10,
                },
            };
        });
        await this.redisService.cacheSet(cacheKey, JSON.stringify(result), ANALYTICS_CACHE_TTL);
        return result;
    }
    async getClientInsights(tenantId, from, to) {
        const cacheKey = `cache:client_insights:${tenantId}:${from}:${to}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const rows = await manager.query(`
        SELECT
          c.id AS client_id,
          c.name AS client_name,
          (SELECT COUNT(*) FROM employees emp WHERE emp.client_id = c.id) AS employee_count,
          COUNT(DISTINCT e.id) AS expense_count,
          COALESCE(SUM(e.original_amount), 0) AS total_original,
          COALESCE(SUM(e.final_amount_deductible), 0) AS total_deductible,
          COUNT(DISTINCT e.id) FILTER (WHERE e.approval_decision = 'approved') AS approved_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.approval_decision = 'rejected') AS rejected_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'approved' AND e.approval_decision IS NULL) AS pending_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.erp_exported = true) AS erp_exported_count,
          COUNT(DISTINCT e.id) FILTER (WHERE e.approval_decision = 'approved' AND e.erp_exported = false) AS erp_pending_count,
          AVG(CASE WHEN e.accountant_reviewed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (e.accountant_reviewed_at - e.created_at)) / 3600.0
            ELSE NULL END) AS avg_processing_hours,
          MODE() WITHIN GROUP (ORDER BY e.final_category) AS top_category
        FROM clients c
        LEFT JOIN expenses e ON e.client_id = c.id
          AND e.status IN ('approved', 'erp_exported')
          AND e.receipt_date::date BETWEEN $1 AND $2
        GROUP BY c.id, c.name
        ORDER BY COUNT(DISTINCT e.id) DESC, c.name ASC
      `, [from, to]);
            let portfolioApproved = 0;
            let portfolioRejected = 0;
            let portfolioOrig = new decimal_js_1.Decimal(0);
            let portfolioDed = new decimal_js_1.Decimal(0);
            let totalExpenses = 0;
            const clients = rows.map((r) => {
                const count = Number(r.expense_count);
                const approved = Number(r.approved_count);
                const rejected = Number(r.rejected_count);
                const decided = approved + rejected;
                const orig = new decimal_js_1.Decimal(r.total_original);
                const ded = new decimal_js_1.Decimal(r.total_deductible);
                portfolioApproved += approved;
                portfolioRejected += rejected;
                portfolioOrig = portfolioOrig.add(orig);
                portfolioDed = portfolioDed.add(ded);
                totalExpenses += count;
                return {
                    client_id: r.client_id,
                    client_name: r.client_name,
                    employee_count: Number(r.employee_count),
                    expense_count: count,
                    total_original_vnd: orig.toFixed(0),
                    total_deductible_vnd: ded.toFixed(0),
                    approval_rate: decided === 0 ? 0 : Number((approved / decided).toFixed(4)),
                    rejection_rate: decided === 0 ? 0 : Number((rejected / decided).toFixed(4)),
                    pending_count: Number(r.pending_count),
                    erp_exported_count: Number(r.erp_exported_count),
                    erp_pending_count: Number(r.erp_pending_count),
                    avg_processing_hours: r.avg_processing_hours != null
                        ? Math.round(Number(r.avg_processing_hours) * 10) / 10
                        : null,
                    top_category: r.top_category
                        ? (CATEGORY_LABELS[r.top_category] ?? r.top_category)
                        : null,
                };
            });
            const totalDecided = portfolioApproved + portfolioRejected;
            return {
                from,
                to,
                clients,
                portfolio_totals: {
                    total_clients: clients.length,
                    total_expenses: totalExpenses,
                    total_original_vnd: portfolioOrig.toFixed(0),
                    total_deductible_vnd: portfolioDed.toFixed(0),
                    overall_approval_rate: totalDecided === 0 ? 0 : Number((portfolioApproved / totalDecided).toFixed(4)),
                },
            };
        });
        await this.redisService.cacheSet(cacheKey, JSON.stringify(result), ANALYTICS_CACHE_TTL);
        return result;
    }
    async exportAnalyticsCsv(tenantId, from, to, type, groupBy = 'category', clientId) {
        const safeFrom = from.replace(/-/g, '');
        const safeTo = to.replace(/-/g, '');
        let csv;
        let filename;
        if (type === 'spending') {
            const data = await this.getSpendingBreakdown(tenantId, from, to, groupBy, clientId);
            const hdr = ['Group Key', 'Group Label', 'Expense Count', 'Total Original (VND)',
                'Total Deductible (VND)', 'Total PIT (VND)', '% of Total'];
            const lines = data.rows.map((r) => [r.group_key, r.group_label, r.expense_count, r.total_original_vnd,
                r.total_deductible_vnd, r.total_pit_vnd, r.percentage_of_total].map(csvEscape).join(','));
            csv = [hdr.map(csvEscape).join(','), ...lines].join('\n');
            filename = `reclaim-spending-${groupBy}-${safeFrom}-${safeTo}.csv`;
        }
        else if (type === 'gate-performance') {
            const data = await this.getGatePerformance(tenantId, from, to, clientId);
            const hdr = ['Gate', 'Gate Label', 'Expenses', 'Approved', 'Rejected', 'Pending',
                'Approval Rate', 'Rejection Rate', 'Escalation Rate', 'Avg Processing (h)'];
            const lines = data.gates.map((g) => [g.gate, g.gate_label, g.expense_count, g.approved_count, g.rejected_count, g.pending_count,
                (g.approval_rate * 100).toFixed(1) + '%', (g.rejection_rate * 100).toFixed(1) + '%',
                (g.escalation_rate * 100).toFixed(1) + '%',
                g.avg_processing_hours ?? ''].map(csvEscape).join(','));
            csv = [hdr.map(csvEscape).join(','), ...lines].join('\n');
            filename = `reclaim-gate-performance-${safeFrom}-${safeTo}.csv`;
        }
        else {
            const data = await this.getClientInsights(tenantId, from, to);
            const hdr = ['Client ID', 'Client Name', 'Employees', 'Expenses', 'Total Original (VND)',
                'Total Deductible (VND)', 'Approval Rate', 'Rejection Rate', 'Pending',
                'ERP Exported', 'ERP Pending', 'Avg Processing (h)', 'Top Category'];
            const lines = data.clients.map((c) => [c.client_id, c.client_name, c.employee_count, c.expense_count,
                c.total_original_vnd, c.total_deductible_vnd,
                (c.approval_rate * 100).toFixed(1) + '%', (c.rejection_rate * 100).toFixed(1) + '%',
                c.pending_count, c.erp_exported_count, c.erp_pending_count,
                c.avg_processing_hours ?? '', c.top_category ?? ''].map(csvEscape).join(','));
            csv = [hdr.map(csvEscape).join(','), ...lines].join('\n');
            filename = `reclaim-client-insights-${safeFrom}-${safeTo}.csv`;
        }
        return { buffer: Buffer.from('﻿' + csv, 'utf-8'), filename };
    }
    async buildDocumentZip(tenantId, from, to, clientId) {
        const [rows, commentsRows] = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const params = [tenantId, from, to];
            const clientClause = clientId ? `AND e.client_id = $${params.push(clientId)}` : '';
            const expRows = await manager.query(`
        SELECT
          e.id,
          e.receipt_date::date  AS receipt_date,
          e.receipt_image_url,
          e.supporting_documents,
          c.name                AS client_name,
          emp.full_name         AS employee_name,
          emp.employee_id       AS employee_internal_id
        FROM expenses e
        JOIN employees emp ON emp.id = e.employee_id
        JOIN clients   c   ON c.id   = e.client_id
        WHERE c.partner_id = $1
          AND e.status IN ('approved','erp_exported')
          AND e.receipt_date::date BETWEEN $2 AND $3
          ${clientClause}
        ORDER BY c.name, emp.full_name, e.receipt_date
      `, params);
            const ids = expRows.map((r) => r.id);
            const cmtRows = ids.length ? await manager.query(`SELECT ec.id, ec.expense_id, ec.body, ec.created_at,
                u.email AS user_email, u.role AS user_role
         FROM expense_comments ec
         JOIN users u ON u.id = ec.user_id
         WHERE ec.expense_id = ANY($1::uuid[])
         ORDER BY ec.created_at ASC`, [ids]) : [];
            return [expRows, cmtRows];
        });
        const commentsMap = new Map();
        for (const c of commentsRows) {
            const list = commentsMap.get(c.expense_id) ?? [];
            list.push(c);
            commentsMap.set(c.expense_id, list);
        }
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const gcsBucket = process.env.GCS_BUCKET_NAME;
        const gcsStorage = gcsBucket ? new storage_1.Storage() : null;
        const readFileContent = async (rel) => {
            if (gcsStorage && gcsBucket) {
                try {
                    const [buf] = await gcsStorage.bucket(gcsBucket).file(rel).download();
                    return buf;
                }
                catch {
                    return null;
                }
            }
            const abs = path.join(uploadsDir, rel);
            if (!abs.startsWith(uploadsDir + path.sep) || !fs.existsSync(abs))
                return null;
            return fs.promises.readFile(abs);
        };
        const zipEntries = {};
        let fileCount = 0;
        let skipCount = 0;
        const manifestLines = [
            'Reclaim! Supporting Document Archive',
            `Period  : ${from} to ${to}`,
            `Created : ${new Date().toISOString()}`,
            `Expenses: ${rows.length}`,
            `Comments: ${commentsRows.length}`,
            '',
            'Files:',
        ];
        for (const row of rows) {
            const dateStr = new Date(row.receipt_date).toISOString().slice(0, 10);
            const shortId = String(row.id).slice(0, 8);
            const dirPrefix = `${safeName(row.client_name)}/` +
                `${safeName(row.employee_name)}_${safeName(row.employee_internal_id)}/` +
                `${dateStr}_${shortId}/`;
            const docs = row.supporting_documents ?? [];
            for (const doc of docs) {
                const rel = fileUrlToRel(doc.url);
                if (!rel) {
                    skipCount++;
                    continue;
                }
                const buf = await readFileContent(rel);
                if (!buf) {
                    skipCount++;
                    continue;
                }
                const ext = path.extname(rel) || '.bin';
                const zipName = doc.type === 'trip_decision_pdf' ? `trip_decision${ext}` : `receipt${ext}`;
                const entry = dirPrefix + zipName;
                zipEntries[entry] = new Uint8Array(buf);
                manifestLines.push(`  ${entry}`);
                fileCount++;
            }
            if (row.receipt_image_url) {
                const rel = fileUrlToRel(row.receipt_image_url);
                if (rel) {
                    const ext = path.extname(rel) || '.jpg';
                    const entry = `${dirPrefix}receipt_image${ext}`;
                    if (!zipEntries[entry]) {
                        const buf = await readFileContent(rel);
                        if (buf) {
                            zipEntries[entry] = new Uint8Array(buf);
                            manifestLines.push(`  ${entry}`);
                            fileCount++;
                        }
                    }
                }
            }
            const expComments = commentsMap.get(row.id);
            if (expComments?.length) {
                const entry = `${dirPrefix}comments.json`;
                zipEntries[entry] = new Uint8Array(Buffer.from(JSON.stringify(expComments.map((c) => ({
                    user: c.user_email,
                    role: c.user_role,
                    body: c.body,
                    created_at: new Date(c.created_at).toISOString(),
                })), null, 2), 'utf-8'));
                manifestLines.push(`  ${entry}`);
                fileCount++;
            }
        }
        manifestLines.push('', `Total files : ${fileCount}`, `Skipped     : ${skipCount}`);
        zipEntries['MANIFEST.txt'] = new Uint8Array(Buffer.from(manifestLines.join('\n'), 'utf-8'));
        const zipped = (0, fflate_1.zipSync)(zipEntries, { level: 0 });
        const safeFrom = from.replace(/-/g, '');
        const safeTo = to.replace(/-/g, '');
        return {
            buffer: Buffer.from(zipped),
            filename: `reclaim-docs-${safeFrom}-${safeTo}.zip`,
            expenseCount: rows.length,
            fileCount,
            commentCount: commentsRows.length,
        };
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], AccountingService);
function safeName(s) {
    return String(s ?? '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/__+/g, '_')
        .slice(0, 60);
}
function fileUrlToRel(url) {
    if (!url)
        return null;
    if (url.startsWith('/api/files/'))
        return url.slice('/api/files/'.length);
    if (url.startsWith('/uploads/'))
        return url.slice('/uploads/'.length);
    return null;
}
function resolveGroupLabel(groupBy, row) {
    switch (groupBy) {
        case 'category': return CATEGORY_LABELS[row.group_key] ?? row.group_key;
        case 'employee': return row.group_name
            ? `${row.group_name} (${row.employee_code ?? '—'})`
            : row.group_key;
        case 'gate': return GATE_LABELS[Number(row.group_key)]?.name ?? `Gate ${row.group_key}`;
        case 'period': return row.group_key;
        default: return row.group_key;
    }
}
function csvEscape(val) {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
}
//# sourceMappingURL=accounting.service.js.map