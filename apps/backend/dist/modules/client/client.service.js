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
exports.ClientService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const date_1 = require("../../common/utils/date");
let ClientService = class ClientService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getDashboard(clientId) {
        const [[employees], [expenses]] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_active)::int AS active
         FROM employees WHERE client_id = $1`, [clientId]),
            this.dataSource.query(`SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'pending')::int   AS pending,
                COUNT(*) FILTER (WHERE status = 'approved')::int  AS approved,
                COALESCE(SUM(amount_vnd) FILTER (WHERE status = 'approved'), 0)::text AS approved_amount_vnd,
                COUNT(*) FILTER (
                  WHERE created_at >= date_trunc('month', NOW()))::int AS this_month
         FROM expenses WHERE client_id = $1`, [clientId]),
        ]);
        return {
            totalEmployees: employees.total,
            activeEmployees: employees.active,
            totalExpenses: expenses.total,
            pendingExpenses: expenses.pending,
            approvedExpenses: expenses.approved,
            approvedAmountVnd: expenses.approved_amount_vnd,
            expensesThisMonth: expenses.this_month,
        };
    }
    async listEmployees(clientId) {
        const rows = await this.dataSource.query(`SELECT id, employee_id, full_name, is_active, pdpd_consent
       FROM employees
       WHERE client_id = $1
       ORDER BY full_name`, [clientId]);
        return rows.map(r => ({
            id: r.id,
            employee_id: r.employee_id,
            full_name: r.full_name,
            is_active: r.is_active,
            pdpd_consent: r.pdpd_consent,
        }));
    }
    async createEmployee(clientId, dto) {
        const existing = await this.dataSource.query(`SELECT id FROM employees WHERE client_id = $1 AND employee_id = $2 LIMIT 1`, [clientId, dto.employee_id]);
        if (existing.length)
            throw new common_1.ConflictException('Employee ID already exists for this client');
        const rows = await this.dataSource.query(`INSERT INTO employees (client_id, employee_id, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, employee_id, full_name, is_active, pdpd_consent`, [clientId, dto.employee_id, dto.full_name]);
        return rows[0];
    }
    async updateEmployee(employeeId, clientId, dto) {
        const setClauses = [];
        const params = [];
        let i = 1;
        if (dto.full_name !== undefined) {
            setClauses.push(`full_name = $${i++}`);
            params.push(dto.full_name);
        }
        if (dto.is_active !== undefined) {
            setClauses.push(`is_active = $${i++}`);
            params.push(dto.is_active);
        }
        if (dto.pdpd_consent !== undefined) {
            setClauses.push(`pdpd_consent = $${i++}`);
            params.push(dto.pdpd_consent);
        }
        if (!setClauses.length)
            throw new common_1.ConflictException('No fields to update');
        params.push(employeeId, clientId);
        const updated = await this.dataSource.query(`UPDATE employees SET ${setClauses.join(', ')}
       WHERE id = $${i} AND client_id = $${i + 1}
       RETURNING id, employee_id, full_name, is_active, pdpd_consent`, params);
        if (!updated.length)
            throw new common_1.NotFoundException('Employee not found');
        return updated[0];
    }
    async getExpenseSummary(clientId, from, to) {
        const f = from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
        const t = to ?? new Date().toISOString();
        const rows = await this.dataSource.query(`SELECT e.id, e.employee_id, em.full_name AS employee_name,
              e.amount_vnd::text, e.status, e.category, e.created_at
       FROM expenses e
       JOIN employees em ON em.id = e.employee_id
       WHERE e.client_id = $1 AND e.created_at BETWEEN $2 AND $3
       ORDER BY e.created_at DESC
       LIMIT 100`, [clientId, f, t]);
        return { from: f, to: t, items: rows.map(r => ({ ...r, created_at: (0, date_1.toIso)(r.created_at) })) };
    }
};
exports.ClientService = ClientService;
exports.ClientService = ClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], ClientService);
//# sourceMappingURL=client.service.js.map