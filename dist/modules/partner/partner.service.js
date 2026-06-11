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
exports.PartnerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const date_1 = require("../../common/utils/date");
const employee_id_util_1 = require("../../common/utils/employee-id.util");
let PartnerService = class PartnerService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getDashboard(partnerId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const [clientsRow] = await manager.query(`SELECT COUNT(*)::int AS total FROM clients WHERE partner_id = $1`, [partnerId]);
            const [employeesRow] = await manager.query(`SELECT COUNT(e.id)::int AS total FROM employees e
         JOIN clients c ON c.id = e.client_id WHERE c.partner_id = $1 AND e.is_active = true`, [partnerId]);
            const [expensesRow] = await manager.query(`SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE exp.status = 'pending')::int AS pending,
           COUNT(*) FILTER (WHERE exp.status = 'approved')::int AS approved,
           COALESCE(SUM(exp.amount_vnd),0)::text AS total_amount_vnd,
           COUNT(*) FILTER (
             WHERE exp.created_at >= date_trunc('month', NOW()))::int AS this_month
         FROM expenses exp
         JOIN clients c ON c.id = exp.client_id
         WHERE c.partner_id = $1`, [partnerId]);
            return {
                totalClients: clientsRow?.total ?? 0,
                totalEmployees: employeesRow?.total ?? 0,
                totalExpenses: expensesRow?.total ?? 0,
                pendingExpenses: expensesRow?.pending ?? 0,
                approvedExpenses: expensesRow?.approved ?? 0,
                totalAmountVnd: expensesRow?.total_amount_vnd ?? '0',
                expensesThisMonth: expensesRow?.this_month ?? 0,
            };
        });
    }
    async listClients(partnerId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const rows = await manager.query(`SELECT c.id, c.name, c.is_active, c.created_at,
                COUNT(DISTINCT e.id)::int  AS employee_count,
                COUNT(DISTINCT ex.id)::int AS expense_count,
                COUNT(DISTINCT ex.id) FILTER (WHERE ex.status = 'pending')::int AS pending_count
         FROM clients c
         LEFT JOIN employees e  ON e.client_id = c.id
         LEFT JOIN expenses  ex ON ex.client_id = c.id
         WHERE c.partner_id = $1
         GROUP BY c.id, c.name, c.is_active, c.created_at
         ORDER BY c.name`, [partnerId]);
            return rows.map(r => ({
                id: r.id,
                name: r.name,
                is_active: r.is_active,
                created_at: (0, date_1.toIso)(r.created_at),
                employee_count: r.employee_count,
                expense_count: r.expense_count,
                pending_count: r.pending_count,
            }));
        });
    }
    async createClient(partnerId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const existing = await manager.query(`SELECT id FROM clients WHERE partner_id = $1 AND name = $2 LIMIT 1`, [partnerId, dto.name]);
            if (existing.length)
                throw new common_1.ConflictException('Client with this name already exists');
            const rows = await manager.query(`INSERT INTO clients (partner_id, name) VALUES ($1, $2) RETURNING id, name, is_active, created_at`, [partnerId, dto.name]);
            const r = rows[0];
            return { id: r.id, name: r.name, is_active: r.is_active, created_at: (0, date_1.toIso)(r.created_at), employee_count: 0, expense_count: 0, pending_count: 0 };
        });
    }
    async updateClient(clientId, partnerId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const setClauses = [];
            const params = [];
            let i = 1;
            if (dto.name !== undefined) {
                setClauses.push(`name = $${i++}`);
                params.push(dto.name);
            }
            if (dto.is_active !== undefined) {
                setClauses.push(`is_active = $${i++}`);
                params.push(dto.is_active);
            }
            if (!setClauses.length)
                return this.fetchClientInTx(manager, clientId, partnerId);
            params.push(clientId, partnerId);
            const updated = await manager.query(`UPDATE clients SET ${setClauses.join(', ')} WHERE id = $${i} AND partner_id = $${i + 1} RETURNING id`, params);
            if (!updated.length)
                throw new common_1.NotFoundException('Client not found');
            return this.fetchClientInTx(manager, clientId, partnerId);
        });
    }
    async fetchClientInTx(manager, clientId, partnerId) {
        const rows = await manager.query(`SELECT c.id, c.name, c.is_active, c.created_at,
              COUNT(DISTINCT e.id)::int  AS employee_count,
              COUNT(DISTINCT ex.id)::int AS expense_count,
              COUNT(DISTINCT ex.id) FILTER (WHERE ex.status = 'pending')::int AS pending_count
       FROM clients c
       LEFT JOIN employees e  ON e.client_id = c.id
       LEFT JOIN expenses  ex ON ex.client_id = c.id
       WHERE c.id = $1 AND c.partner_id = $2
       GROUP BY c.id, c.name, c.is_active, c.created_at`, [clientId, partnerId]);
        if (!rows.length)
            throw new common_1.NotFoundException('Client not found');
        const r = rows[0];
        return { id: r.id, name: r.name, is_active: r.is_active, created_at: (0, date_1.toIso)(r.created_at), employee_count: r.employee_count, expense_count: r.expense_count, pending_count: r.pending_count };
    }
    async listEmployees(partnerId, clientId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const conditions = ['c.partner_id = $1'];
            const params = [partnerId];
            if (clientId) {
                conditions.push(`e.client_id = $2`);
                params.push(clientId);
            }
            const rows = await manager.query(`SELECT e.id, e.employee_id, e.full_name, e.is_active, e.pdpd_consent,
                c.id AS client_id, c.name AS client_name
         FROM employees e
         JOIN clients c ON c.id = e.client_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY c.name, e.full_name`, params);
            return rows.map(r => ({
                id: r.id,
                employee_id: r.employee_id,
                full_name: r.full_name,
                is_active: r.is_active,
                pdpd_consent: r.pdpd_consent,
                client_id: r.client_id,
                client_name: r.client_name,
            }));
        });
    }
    async createEmployee(partnerId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const [clientCheck] = await manager.query(`SELECT id FROM clients WHERE id = $1 AND partner_id = $2`, [dto.client_id, partnerId]);
            if (!clientCheck)
                throw new common_1.NotFoundException('Client not found');
            const employeeId = dto.employee_id || await (0, employee_id_util_1.generateEmployeeId)(manager, dto.client_id);
            const [existing] = await manager.query(`SELECT id FROM employees WHERE client_id = $1 AND employee_id = $2 LIMIT 1`, [dto.client_id, employeeId]);
            if (existing)
                throw new common_1.ConflictException('Employee ID already exists for this client');
            const [r] = await manager.query(`INSERT INTO employees (client_id, employee_id, full_name)
         VALUES ($1, $2, $3)
         RETURNING id, employee_id, full_name, is_active, pdpd_consent`, [dto.client_id, employeeId, dto.full_name]);
            return { id: r.id, employee_id: r.employee_id, full_name: r.full_name, is_active: r.is_active, pdpd_consent: r.pdpd_consent, client_id: dto.client_id };
        });
    }
    async updateEmployee(employeeId, partnerId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
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
            params.push(employeeId);
            const updated = await manager.query(`UPDATE employees e SET ${setClauses.join(', ')}
         FROM clients c
         WHERE e.id = $${i} AND e.client_id = c.id AND c.partner_id = $${i + 1}
         RETURNING e.id, e.employee_id, e.full_name, e.is_active, e.pdpd_consent, e.client_id`, [...params, partnerId]);
            if (!updated.length)
                throw new common_1.NotFoundException('Employee not found');
            return updated[0];
        });
    }
    async getReports(partnerId, query) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            const from = query.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
            const to = query.to ?? new Date().toISOString();
            const conditions = ['c.partner_id = $1', 'ex.created_at BETWEEN $2 AND $3'];
            const params = [partnerId, from, to];
            if (query.client_id) {
                conditions.push(`c.id = $4`);
                params.push(query.client_id);
            }
            const rows = await manager.query(`SELECT c.id AS client_id, c.name AS client_name,
                COUNT(ex.id)::int AS total,
                COUNT(ex.id) FILTER (WHERE ex.status = 'pending')::int    AS pending,
                COUNT(ex.id) FILTER (WHERE ex.status = 'approved')::int   AS approved,
                COUNT(ex.id) FILTER (WHERE ex.status = 'rejected')::int   AS rejected,
                COALESCE(SUM(ex.amount_vnd) FILTER (WHERE ex.status = 'approved'),0)::text AS approved_amount_vnd
         FROM clients c
         LEFT JOIN expenses ex ON ex.client_id = c.id AND ex.created_at BETWEEN $2 AND $3
         WHERE ${conditions.filter(c => !c.includes('ex.created_at')).join(' AND ')}
         GROUP BY c.id, c.name
         ORDER BY total DESC`, params);
            return { from, to, items: rows };
        });
    }
};
exports.PartnerService = PartnerService;
exports.PartnerService = PartnerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], PartnerService);
//# sourceMappingURL=partner.service.js.map