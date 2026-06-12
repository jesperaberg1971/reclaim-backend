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
exports.PdpdService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let PdpdService = class PdpdService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async exportEmployeeData(employeeId, requestorPartnerId, requestorUserId, requestorRole, ipAddress) {
        const empRows = await this.dataSource.query(`SELECT e.id, e.employee_id, e.full_name, e.client_id, e.is_active, e.pdpd_consent,
              c.name AS client_name, c.partner_id
       FROM employees e
       JOIN clients c ON c.id = e.client_id
       WHERE e.id = $1`, [employeeId]);
        if (!empRows.length)
            throw new common_1.NotFoundException(`Employee ${employeeId} not found`);
        const emp = empRows[0];
        if (requestorRole === 'partner_admin' && emp.partner_id !== requestorPartnerId) {
            throw new common_1.ForbiddenException('Access denied: employee belongs to a different tenant');
        }
        const [bankRows, expenseRows, attendanceRows, logRows] = await Promise.all([
            this.dataSource.query(`SELECT id, bank_name, account_number_last4, is_primary
         FROM employee_bank_accounts WHERE employee_id = $1 ORDER BY is_primary DESC`, [employeeId]),
            this.dataSource.query(`SELECT id, receipt_date, final_category, original_amount::text, status, created_at
         FROM expenses WHERE employee_id = $1 ORDER BY created_at DESC`, [employeeId]),
            this.dataSource.query(`SELECT id, latitude, longitude, created_at
         FROM attendance_checkins WHERE employee_id = $1 ORDER BY created_at DESC`, [employeeId]),
            this.dataSource.query(`SELECT id, employee_id, event, performed_by_user_id, performed_by_role,
                ip_address, metadata, created_at
         FROM pdpd_consent_log WHERE employee_id = $1 ORDER BY created_at ASC`, [employeeId]),
        ]);
        await this.logEvent(employeeId, 'data_exported', requestorUserId, requestorRole, ipAddress, {
            requested_by: requestorRole,
        });
        const now = new Date().toISOString();
        return {
            employee: {
                id: emp.id,
                employee_id: emp.employee_id,
                full_name: emp.full_name,
                client_id: emp.client_id,
                client_name: emp.client_name,
                partner_id: emp.partner_id,
                is_active: emp.is_active,
                pdpd_consent: emp.pdpd_consent,
            },
            bank_accounts: bankRows.map((r) => ({
                id: r.id,
                bank_name: r.bank_name,
                account_number_last4: r.account_number_last4,
                is_primary: r.is_primary,
            })),
            expenses: expenseRows.map((r) => ({
                id: r.id,
                receipt_date: r.receipt_date ? new Date(r.receipt_date).toISOString() : null,
                final_category: r.final_category,
                original_amount: r.original_amount,
                status: r.status,
                created_at: new Date(r.created_at).toISOString(),
            })),
            attendance: attendanceRows.map((r) => ({
                id: r.id,
                latitude: r.latitude != null ? parseFloat(r.latitude) : null,
                longitude: r.longitude != null ? parseFloat(r.longitude) : null,
                created_at: new Date(r.created_at).toISOString(),
            })),
            consent_log: logRows.map(this.mapLogRow),
            exported_at: now,
        };
    }
    async withdrawConsent(employeeId, requestorPartnerId, requestorUserId, requestorRole, ipAddress) {
        const empRows = await this.dataSource.query(`SELECT e.id, e.pdpd_consent, c.partner_id
       FROM employees e JOIN clients c ON c.id = e.client_id
       WHERE e.id = $1`, [employeeId]);
        if (!empRows.length)
            throw new common_1.NotFoundException(`Employee ${employeeId} not found`);
        const emp = empRows[0];
        if (requestorRole === 'partner_admin' && emp.partner_id !== requestorPartnerId) {
            throw new common_1.ForbiddenException('Access denied: employee belongs to a different tenant');
        }
        const anonName = 'Ẩn danh';
        const anonEmpId = `ANON-${employeeId.slice(0, 8).toUpperCase()}`;
        await this.dataSource.query(`UPDATE employees
       SET full_name = $1,
           employee_id = $2,
           personal_bank_card_last4 = NULL,
           pdpd_consent = FALSE
       WHERE id = $3`, [anonName, anonEmpId, employeeId]);
        await this.dataSource.query(`DELETE FROM employee_bank_accounts WHERE employee_id = $1`, [employeeId]);
        await this.logEvent(employeeId, 'data_anonymized', requestorUserId, requestorRole, ipAddress, {
            original_had_consent: emp.pdpd_consent,
            anon_employee_id: anonEmpId,
        });
        return { anonymized: true, employee_id: anonEmpId };
    }
    async recordConsentGiven(employeeId, requestorPartnerId, requestorUserId, requestorRole, ipAddress) {
        const empRows = await this.dataSource.query(`SELECT e.id, c.partner_id FROM employees e JOIN clients c ON c.id = e.client_id WHERE e.id = $1`, [employeeId]);
        if (!empRows.length)
            throw new common_1.NotFoundException(`Employee ${employeeId} not found`);
        const emp = empRows[0];
        if (requestorRole === 'partner_admin' && emp.partner_id !== requestorPartnerId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        await this.dataSource.query(`UPDATE employees SET pdpd_consent = TRUE WHERE id = $1`, [employeeId]);
        await this.logEvent(employeeId, 'consent_given', requestorUserId, requestorRole, ipAddress, {});
        return { employee_id: employeeId, pdpd_consent: true };
    }
    async getConsentLog(employeeId, requestorPartnerId, requestorRole) {
        const empRows = await this.dataSource.query(`SELECT e.id, c.partner_id FROM employees e JOIN clients c ON c.id = e.client_id WHERE e.id = $1`, [employeeId]);
        if (!empRows.length)
            throw new common_1.NotFoundException(`Employee ${employeeId} not found`);
        if (requestorRole === 'partner_admin' && empRows[0].partner_id !== requestorPartnerId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const rows = await this.dataSource.query(`SELECT id, employee_id, event, performed_by_user_id, performed_by_role,
              ip_address, metadata, created_at
       FROM pdpd_consent_log WHERE employee_id = $1 ORDER BY created_at ASC`, [employeeId]);
        return rows.map(this.mapLogRow);
    }
    async logEvent(employeeId, event, userId, role, ipAddress, metadata) {
        await this.dataSource.query(`INSERT INTO pdpd_consent_log
         (employee_id, event, performed_by_user_id, performed_by_role, ip_address, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`, [employeeId, event, userId ?? null, role ?? null, ipAddress ?? null, JSON.stringify(metadata)]);
    }
    mapLogRow(r) {
        return {
            id: r.id,
            employee_id: r.employee_id,
            event: r.event,
            performed_by_user_id: r.performed_by_user_id,
            performed_by_role: r.performed_by_role,
            ip_address: r.ip_address,
            metadata: r.metadata ?? {},
            created_at: new Date(r.created_at).toISOString(),
        };
    }
};
exports.PdpdService = PdpdService;
exports.PdpdService = PdpdService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], PdpdService);
//# sourceMappingURL=pdpd.service.js.map