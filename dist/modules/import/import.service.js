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
var ImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = exports.TENANT_CSV_TEMPLATE = exports.EXPENSE_CSV_TEMPLATE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const audit_service_1 = require("../../common/audit/audit.service");
const IMPORTABLE_CATEGORIES = new Set([
    'travel_allowance',
    'welfare_allowance',
    'personal_card_reimbursement',
]);
const EXPENSE_HEADERS = ['date', 'employee_id', 'vendor_name', 'amount_vnd', 'category', 'description'];
const TENANT_HEADERS = ['name', 'tax_code', 'admin_email', 'admin_password'];
const MAX_ROWS = 5000;
const MAX_AMOUNT_VND = 100_000_000;
exports.EXPENSE_CSV_TEMPLATE = 'date,employee_id,vendor_name,amount_vnd,category,description\r\n' +
    '2026-01-15,NV001,Grab,250000,travel_allowance,Công tác TP.HCM\r\n' +
    '2026-01-20,NV002,Bữa ăn Bảo Ngọc,350000,welfare_allowance,Họp nhóm tháng 1\r\n';
exports.TENANT_CSV_TEMPLATE = 'name,tax_code,admin_email,admin_password\r\n' +
    'ABC Corp,0123456789,admin@abc.vn,Password@123\r\n' +
    'XYZ Ltd,9876543210,admin@xyz.vn,Secure#456\r\n';
let ImportService = ImportService_1 = class ImportService {
    constructor(dataSource, auditService) {
        this.dataSource = dataSource;
        this.auditService = auditService;
        this.logger = new common_1.Logger(ImportService_1.name);
    }
    parseCSV(text) {
        const lines = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .filter(l => l.trim());
        if (!lines.length)
            return { headers: [], rows: [] };
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const rows = lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
        });
        return { headers, rows };
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else
                    inQuotes = !inQuotes;
            }
            else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    }
    parseDate(raw) {
        const s = raw.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const d = new Date(s + 'T00:00:00Z');
            return isNaN(d.getTime()) ? null : d;
        }
        const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmy) {
            const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T00:00:00Z`);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }
    parseAmount(raw) {
        const n = Number(raw.trim().replace(/[,\s_]/g, ''));
        if (isNaN(n) || n <= 0 || n > MAX_AMOUNT_VND)
            return null;
        return n;
    }
    async importExpenses(partnerId, fileBuffer, opts = {}) {
        const text = fileBuffer.toString('utf-8');
        const { headers, rows } = this.parseCSV(text);
        const missing = EXPENSE_HEADERS.filter(h => !headers.includes(h));
        if (missing.length) {
            throw new common_1.BadRequestException(`CSV thiếu cột bắt buộc: ${missing.join(', ')}. ` +
                `Tải template tại GET /api/import/template/expenses`);
        }
        if (rows.length > MAX_ROWS) {
            throw new common_1.BadRequestException(`CSV quá lớn: ${rows.length} hàng (tối đa ${MAX_ROWS})`);
        }
        const empRows = await this.dataSource.query(`SELECT e.id AS uuid, e.employee_id AS emp_code, e.client_id
       FROM employees e
       JOIN clients c ON c.id = e.client_id
       WHERE c.partner_id = $1`, [partnerId]);
        const empMap = new Map(empRows.map(r => [r.emp_code, { uuid: r.uuid, client_id: r.client_id }]));
        const errors = [];
        const validRows = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowN = i + 2;
            const date = this.parseDate(row.date);
            const amount = this.parseAmount(row.amount_vnd);
            const cat = row.category?.trim().toLowerCase();
            const emp = empMap.get(row.employee_id?.trim());
            if (!row.date) {
                errors.push({ row: rowN, field: 'date', message: 'Trường bắt buộc' });
                continue;
            }
            if (!date) {
                errors.push({ row: rowN, field: 'date', message: `Không hợp lệ: "${row.date}". Dùng YYYY-MM-DD hoặc DD/MM/YYYY` });
                continue;
            }
            if (!row.amount_vnd) {
                errors.push({ row: rowN, field: 'amount_vnd', message: 'Trường bắt buộc' });
                continue;
            }
            if (amount === null) {
                errors.push({ row: rowN, field: 'amount_vnd', message: `Không hợp lệ: "${row.amount_vnd}". Phải là số dương ≤ ${MAX_AMOUNT_VND.toLocaleString()}` });
                continue;
            }
            if (!cat || !IMPORTABLE_CATEGORIES.has(cat)) {
                errors.push({ row: rowN, field: 'category', message: `Không hợp lệ: "${row.category}". Giá trị: travel_allowance | welfare_allowance | personal_card_reimbursement` });
                continue;
            }
            if (!row.employee_id) {
                errors.push({ row: rowN, field: 'employee_id', message: 'Trường bắt buộc' });
                continue;
            }
            if (!emp) {
                errors.push({ row: rowN, field: 'employee_id', message: `Mã nhân viên không tồn tại: "${row.employee_id}"` });
                continue;
            }
            validRows.push({
                client_id: emp.client_id,
                employee_id: emp.uuid,
                receipt_date: date,
                original_amount: amount,
                category: cat,
                vendor_name: row.vendor_name || '',
                description: row.description || '',
            });
        }
        if (opts.dry_run) {
            return {
                total: rows.length,
                imported: 0,
                skipped: errors.length,
                dry_run: true,
                errors,
            };
        }
        const BATCH = 100;
        let imported = 0;
        for (let start = 0; start < validRows.length; start += BATCH) {
            const chunk = validRows.slice(start, start + BATCH);
            const placeholders = chunk
                .map((_, j) => {
                const base = j * 9 + 1;
                return `($${base},$${base + 1},$${base + 2},$${base + 3}::jsonb,$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
            })
                .join(', ');
            const params = chunk.flatMap(r => [
                r.client_id,
                r.employee_id,
                r.original_amount,
                JSON.stringify({ vendor_name: r.vendor_name, import_note: r.description, import_source: 'csv' }),
                r.receipt_date.toISOString(),
                r.category,
                r.original_amount,
                'approved',
                '[]',
            ]);
            await this.dataSource.query(`INSERT INTO expenses
           (client_id, employee_id, original_amount, ocr_raw_json,
            receipt_date, final_category, final_amount_deductible, status,
            supporting_documents)
         VALUES ${placeholders}`, params);
            imported += chunk.length;
        }
        void this.auditService.log({
            tenantId: partnerId,
            action: 'erp_export',
            resourceType: 'expense',
            metadata: { import_type: 'csv', total: rows.length, imported, errors: errors.length },
        });
        this.logger.log(`[${partnerId}] CSV expense import: ${imported} inserted, ${errors.length} errors`);
        return {
            total: rows.length,
            imported,
            skipped: errors.length,
            dry_run: false,
            errors,
        };
    }
    async bulkProvisionTenants(fileBuffer, adminUserId) {
        const text = fileBuffer.toString('utf-8');
        const { headers, rows } = this.parseCSV(text);
        const missing = TENANT_HEADERS.filter(h => !headers.includes(h));
        if (missing.length) {
            throw new common_1.BadRequestException(`CSV thiếu cột: ${missing.join(', ')}. Tải template tại GET /api/import/template/tenants`);
        }
        if (rows.length > 500) {
            throw new common_1.BadRequestException(`CSV quá lớn: ${rows.length} hàng (tối đa 500)`);
        }
        const results = [];
        let succeeded = 0, failed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowN = i + 2;
            const name = row.name?.trim();
            const tax = row.tax_code?.trim();
            const email = row.admin_email?.trim().toLowerCase();
            const pass = row.admin_password?.trim();
            if (!name || !tax || !email || !pass) {
                results.push({ row: rowN, name: name || '(trống)', status: 'error', message: 'Thiếu trường bắt buộc' });
                failed++;
                continue;
            }
            if (pass.length < 8) {
                results.push({ row: rowN, name, status: 'error', message: 'Mật khẩu phải có ít nhất 8 ký tự' });
                failed++;
                continue;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                results.push({ row: rowN, name, status: 'error', message: `Email không hợp lệ: ${email}` });
                failed++;
                continue;
            }
            try {
                await this.provisionOneTenant(name, tax, email, pass, adminUserId);
                results.push({ row: rowN, name, status: 'ok' });
                succeeded++;
            }
            catch (err) {
                results.push({ row: rowN, name, status: 'error', message: err.message ?? 'Lỗi không xác định' });
                failed++;
            }
        }
        this.logger.log(`Bulk provision: ${succeeded} ok, ${failed} failed (userId=${adminUserId})`);
        return { total: rows.length, succeeded, failed, results };
    }
    async provisionOneTenant(name, taxCode, adminEmail, adminPassword, adminUserId) {
        const existing = await this.dataSource.query(`SELECT id FROM partners WHERE name = $1 OR tax_code = $2 LIMIT 1`, [name, taxCode]);
        if (existing.length)
            throw new Error(`Tenant "${name}" (${taxCode}) đã tồn tại`);
        const emailTaken = await this.dataSource.query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
        if (emailTaken.length)
            throw new Error(`Email ${adminEmail} đã được sử dụng`);
        const defaultPolicies = {
            meal_cap_vnd: 0, per_diem_daily_vnd: 0, welfare_monthly_cap_vnd: 0,
            personal_card_limit_vnd: 0, allowed_categories: [],
            require_original_receipt: false, require_manager_approval: false,
            approval_escalation_hours: 0,
        };
        const partnerRows = await this.dataSource.query(`INSERT INTO partners (name, tax_code, policies) VALUES ($1, $2, $3::jsonb) RETURNING id`, [name, taxCode, JSON.stringify(defaultPolicies)]);
        const partnerId = partnerRows[0].id;
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await this.dataSource.query(`INSERT INTO users (email, password_hash, role, partner_id) VALUES ($1, $2, 'partner_admin', $3)`, [adminEmail, passwordHash, partnerId]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'partner_created',
            resourceType: 'partner',
            resourceId: partnerId,
            metadata: { name, admin_email: adminEmail, import_source: 'csv_bulk' },
        });
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = ImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_service_1.AuditService])
], ImportService);
//# sourceMappingURL=import.service.js.map