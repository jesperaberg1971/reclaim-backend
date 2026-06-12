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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const audit_service_1 = require("../../common/audit/audit.service");
const date_1 = require("../../common/utils/date");
let AdminService = class AdminService {
    constructor(dataSource, auditService) {
        this.dataSource = dataSource;
        this.auditService = auditService;
    }
    async listTenants(query) {
        const conditions = [];
        const params = [];
        let i = 1;
        if (query.activeOnly) {
            conditions.push(`p.is_active = true`);
        }
        if (query.search) {
            params.push(`%${query.search}%`);
            conditions.push(`(p.name ILIKE $${i} OR p.tax_code ILIKE $${i})`);
            i++;
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRow = await this.dataSource.query(`SELECT COUNT(*) AS total FROM partners p ${where}`, params);
        const total = Number(countRow[0].total);
        params.push(query.limit ?? 50, query.offset ?? 0);
        const rows = await this.dataSource.query(`SELECT
         p.id, p.name, p.tax_code, p.is_active, p.created_at,
         COUNT(DISTINCT c.id)::int   AS client_count,
         COUNT(DISTINCT u.id)::int   AS user_count,
         s.tier                      AS subscription_tier
       FROM partners p
       LEFT JOIN clients       c ON c.partner_id = p.id
       LEFT JOIN users         u ON u.partner_id = p.id
       LEFT JOIN subscriptions s ON s.partner_id = p.id
       ${where}
       GROUP BY p.id, p.name, p.tax_code, p.is_active, p.created_at, s.tier
       ORDER BY p.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`, params);
        return {
            total,
            items: rows.map(r => ({
                id: r.id,
                name: r.name,
                tax_code: r.tax_code,
                is_active: r.is_active,
                created_at: (0, date_1.toIso)(r.created_at),
                client_count: r.client_count,
                user_count: r.user_count,
                subscription_tier: r.subscription_tier ?? null,
            })),
        };
    }
    async getTenant(tenantId) {
        const rows = await this.dataSource.query(`SELECT
         p.id, p.name, p.tax_code, p.is_active, p.policies, p.created_at,
         COUNT(DISTINCT c.id)::int   AS client_count,
         COUNT(DISTINCT u.id)::int   AS user_count,
         s.tier                      AS subscription_tier,
         s.monthly_price_vnd,
         s.next_billing_date
       FROM partners p
       LEFT JOIN clients       c ON c.partner_id = p.id
       LEFT JOIN users         u ON u.partner_id = p.id
       LEFT JOIN subscriptions s ON s.partner_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, p.name, p.tax_code, p.is_active, p.policies, p.created_at,
                s.tier, s.monthly_price_vnd, s.next_billing_date`, [tenantId]);
        if (!rows.length)
            throw new common_1.NotFoundException(`Tenant ${tenantId} not found`);
        const r = rows[0];
        return {
            id: r.id,
            name: r.name,
            tax_code: r.tax_code,
            is_active: r.is_active,
            policies: r.policies ?? {},
            created_at: (0, date_1.toIso)(r.created_at),
            client_count: r.client_count,
            user_count: r.user_count,
            subscription_tier: r.subscription_tier ?? null,
            monthly_price_vnd: r.monthly_price_vnd ? String(r.monthly_price_vnd) : null,
            next_billing_date: (0, date_1.toIso)(r.next_billing_date),
        };
    }
    async createTenant(dto, adminUserId) {
        const existing = await this.dataSource.query(`SELECT id FROM partners WHERE name = $1 OR tax_code = $2 LIMIT 1`, [dto.name, dto.tax_code]);
        if (existing.length)
            throw new common_1.ConflictException('Tenant with same name or tax code already exists');
        const defaultPolicies = {
            meal_cap_vnd: 0,
            per_diem_daily_vnd: 0,
            welfare_monthly_cap_vnd: 0,
            personal_card_limit_vnd: 0,
            allowed_categories: [],
            require_original_receipt: false,
            require_manager_approval: false,
            approval_escalation_hours: 0,
            ...dto.policies,
        };
        const rows = await this.dataSource.query(`INSERT INTO partners (name, tax_code, policies)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id`, [dto.name, dto.tax_code, JSON.stringify(defaultPolicies)]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'partner_created',
            resourceType: 'partner',
            resourceId: rows[0].id,
            metadata: { name: dto.name },
        });
        return this.getTenant(rows[0].id);
    }
    async updateTenant(tenantId, dto, adminUserId) {
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
        if (dto.policies !== undefined) {
            setClauses.push(`policies = $${i++}::jsonb`);
            params.push(JSON.stringify(dto.policies));
        }
        if (!setClauses.length)
            return this.getTenant(tenantId);
        params.push(tenantId);
        const updated = await this.dataSource.query(`UPDATE partners SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING id`, params);
        if (!updated.length)
            throw new common_1.NotFoundException(`Tenant ${tenantId} not found`);
        void this.auditService.log({
            tenantId,
            userId: adminUserId,
            action: 'policy_update',
            resourceType: 'partner',
            resourceId: tenantId,
            metadata: dto,
        });
        return this.getTenant(tenantId);
    }
    async listUsers(query) {
        const conditions = [];
        const params = [];
        let i = 1;
        if (query.tenantId) {
            params.push(query.tenantId);
            conditions.push(`u.partner_id = $${i++}`);
        }
        if (query.role) {
            params.push(query.role);
            conditions.push(`u.role = $${i++}`);
        }
        if (query.activeOnly)
            conditions.push(`u.is_active = true`);
        if (query.search) {
            params.push(`%${query.search}%`);
            conditions.push(`u.email ILIKE $${i++}`);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRow = await this.dataSource.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);
        const total = Number(countRow[0].total);
        params.push(query.limit ?? 50, query.offset ?? 0);
        const rows = await this.dataSource.query(`SELECT u.id, u.email, u.role, u.is_active, u.created_at,
              u.partner_id AS tenant_id,
              p.name       AS tenant_name
       FROM users u
       LEFT JOIN partners p ON p.id = u.partner_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`, params);
        return {
            total,
            items: rows.map(r => ({
                id: r.id,
                email: r.email,
                role: r.role,
                is_active: r.is_active,
                created_at: (0, date_1.toIso)(r.created_at),
                tenant_id: r.tenant_id ?? null,
                tenant_name: r.tenant_name ?? null,
            })),
        };
    }
    async updateUser(userId, dto, adminUserId) {
        const setClauses = [];
        const params = [];
        let i = 1;
        if (dto.is_active !== undefined) {
            setClauses.push(`is_active = $${i++}`);
            params.push(dto.is_active);
        }
        if (dto.role !== undefined) {
            setClauses.push(`role = $${i++}`);
            params.push(dto.role);
        }
        if (!setClauses.length)
            throw new common_1.ConflictException('No fields to update');
        params.push(userId);
        const updated = await this.dataSource.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING id`, params);
        if (!updated.length)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        void this.auditService.log({
            userId: adminUserId,
            action: 'policy_update',
            resourceType: 'user',
            resourceId: userId,
            metadata: dto,
        });
        const rows = await this.dataSource.query(`SELECT u.id, u.email, u.role, u.is_active, u.created_at,
              u.partner_id AS tenant_id, p.name AS tenant_name
       FROM users u LEFT JOIN partners p ON p.id = u.partner_id
       WHERE u.id = $1`, [userId]);
        const r = rows[0];
        return {
            id: r.id, email: r.email, role: r.role, is_active: r.is_active,
            created_at: (0, date_1.toIso)(r.created_at),
            tenant_id: r.tenant_id ?? null,
            tenant_name: r.tenant_name ?? null,
        };
    }
    async adminResetPassword(targetUserId, newPassword, adminUserId) {
        const rows = await this.dataSource.query(`SELECT id FROM users WHERE id = $1`, [targetUserId]);
        if (!rows.length)
            throw new common_1.NotFoundException(`User ${targetUserId} not found`);
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.dataSource.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, targetUserId]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'login',
            resourceType: 'user',
            resourceId: targetUserId,
            metadata: { event: 'admin_password_reset' },
        });
    }
    async createAdminUser(dto, adminUserId) {
        const existing = await this.dataSource.query(`SELECT id FROM users WHERE email = $1`, [dto.email]);
        if (existing.length)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const rows = await this.dataSource.query(`INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'super_admin')
       RETURNING id, email, role, is_active, created_at`, [dto.email, passwordHash]);
        if (!rows.length)
            throw new common_1.InternalServerErrorException('Failed to create admin user');
        void this.auditService.log({
            userId: adminUserId,
            action: 'partner_created',
            resourceType: 'user',
            resourceId: rows[0].id,
            metadata: { role: 'super_admin', email: dto.email },
        });
        const r = rows[0];
        return {
            id: r.id, email: r.email, role: r.role, is_active: r.is_active,
            created_at: (0, date_1.toIso)(r.created_at),
            tenant_id: null, tenant_name: null,
        };
    }
    async getAuditLogs(query) {
        const conditions = [];
        const params = [];
        let i = 1;
        if (query.tenantId) {
            params.push(query.tenantId);
            conditions.push(`tenant_id = $${i++}`);
        }
        if (query.userId) {
            params.push(query.userId);
            conditions.push(`user_id = $${i++}`);
        }
        if (query.action) {
            params.push(query.action);
            conditions.push(`action = $${i++}`);
        }
        if (query.from) {
            params.push(query.from);
            conditions.push(`created_at >= $${i++}`);
        }
        if (query.to) {
            params.push(query.to);
            conditions.push(`created_at <= $${i++}`);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRow = await this.dataSource.query(`SELECT COUNT(*) AS total FROM audit_logs ${where}`, params);
        const total = Number(countRow[0].total);
        params.push(query.limit ?? 100, query.offset ?? 0);
        const rows = await this.dataSource.query(`SELECT id, tenant_id, user_id, action, resource_type, resource_id,
              ip_address, metadata, created_at
       FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`, params);
        return {
            total,
            items: rows.map(r => ({
                id: r.id,
                tenant_id: r.tenant_id ?? null,
                user_id: r.user_id ?? null,
                action: r.action,
                resource_type: r.resource_type ?? null,
                resource_id: r.resource_id ?? null,
                ip_address: r.ip_address ?? null,
                metadata: r.metadata ?? null,
                created_at: (0, date_1.toIso)(r.created_at),
            })),
        };
    }
    async bulkActionTenants(dto, adminUserId) {
        if (!dto.ids.length)
            return { affected: 0 };
        const isActive = dto.action === 'activate';
        const placeholders = dto.ids.map((_, i) => `$${i + 2}`).join(', ');
        const result = await this.dataSource.query(`UPDATE partners SET is_active = $1 WHERE id IN (${placeholders}) RETURNING id`, [isActive, ...dto.ids]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'policy_update',
            resourceType: 'partner',
            metadata: { bulk_action: dto.action, ids: dto.ids, affected: result.length },
        });
        return { affected: result.length };
    }
    async bulkActionUsers(dto, adminUserId) {
        if (!dto.ids.length)
            return { affected: 0 };
        const isActive = dto.action === 'activate';
        const placeholders = dto.ids.map((_, i) => `$${i + 2}`).join(', ');
        const result = await this.dataSource.query(`UPDATE users SET is_active = $1 WHERE id IN (${placeholders}) AND role != 'super_admin' RETURNING id`, [isActive, ...dto.ids]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'policy_update',
            resourceType: 'user',
            metadata: { bulk_action: dto.action, ids: dto.ids, affected: result.length },
        });
        return { affected: result.length };
    }
    async getTenantUsage(tenantId) {
        const rows = await this.dataSource.query(`SELECT p.id AS tenant_id, p.name AS tenant_name,
              COUNT(DISTINCT e.id)::int                              AS total_expenses,
              COUNT(DISTINCT e.id) FILTER (
                WHERE e.created_at >= date_trunc('month', NOW()))::int  AS expenses_this_month,
              COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'pending')::int   AS pending_expenses,
              COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'approved')::int  AS approved_expenses,
              COALESCE(SUM(e.amount_vnd), 0)::text                    AS total_amount_vnd,
              COUNT(DISTINCT u.id)::int                               AS total_users,
              COUNT(DISTINCT u.id) FILTER (WHERE u.is_active)::int    AS active_users,
              s.status                                                AS subscription_status,
              s.tier                                                  AS subscription_tier,
              MAX(al.created_at)::text                                AS last_activity
       FROM partners p
       LEFT JOIN clients       c  ON c.partner_id  = p.id
       LEFT JOIN expenses      e  ON e.client_id   = c.id
       LEFT JOIN users         u  ON u.partner_id  = p.id
       LEFT JOIN subscriptions s  ON s.partner_id  = p.id
       LEFT JOIN audit_logs    al ON al.tenant_id  = p.id
       WHERE p.id = $1
       GROUP BY p.id, p.name, s.status, s.tier`, [tenantId]);
        if (!rows.length)
            throw new common_1.NotFoundException(`Tenant ${tenantId} not found`);
        const r = rows[0];
        return {
            tenant_id: r.tenant_id,
            tenant_name: r.tenant_name,
            total_expenses: r.total_expenses,
            expenses_this_month: r.expenses_this_month,
            pending_expenses: r.pending_expenses,
            approved_expenses: r.approved_expenses,
            total_amount_vnd: r.total_amount_vnd,
            total_users: r.total_users,
            active_users: r.active_users,
            subscription_status: r.subscription_status ?? null,
            subscription_tier: r.subscription_tier ?? null,
            last_activity: r.last_activity ? (0, date_1.toIso)(new Date(r.last_activity)) : null,
        };
    }
    async provisionTenant(dto, adminUserId) {
        const existing = await this.dataSource.query(`SELECT id FROM partners WHERE name = $1 OR tax_code = $2 LIMIT 1`, [dto.name, dto.tax_code]);
        if (existing.length)
            throw new common_1.ConflictException('Tenant with same name or tax code already exists');
        const emailTaken = await this.dataSource.query(`SELECT id FROM users WHERE email = $1`, [dto.admin_email]);
        if (emailTaken.length)
            throw new common_1.ConflictException('Admin email already registered');
        const defaultPolicies = {
            meal_cap_vnd: 0, per_diem_daily_vnd: 0, welfare_monthly_cap_vnd: 0,
            personal_card_limit_vnd: 0, allowed_categories: [],
            require_original_receipt: false, require_manager_approval: false,
            approval_escalation_hours: 0,
            ...dto.policies,
        };
        const partnerRows = await this.dataSource.query(`INSERT INTO partners (name, tax_code, policies)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id`, [dto.name, dto.tax_code, JSON.stringify(defaultPolicies)]);
        const partnerId = partnerRows[0].id;
        const passwordHash = await bcrypt.hash(dto.admin_password, 12);
        const userRows = await this.dataSource.query(`INSERT INTO users (email, password_hash, role, partner_id)
       VALUES ($1, $2, 'partner_admin', $3)
       RETURNING id, email, role, is_active, created_at`, [dto.admin_email, passwordHash, partnerId]);
        void this.auditService.log({
            userId: adminUserId,
            action: 'partner_created',
            resourceType: 'partner',
            resourceId: partnerId,
            metadata: { name: dto.name, admin_email: dto.admin_email, provisioned: true },
        });
        const partner = await this.getTenant(partnerId);
        const u = userRows[0];
        const adminUser = {
            id: u.id, email: u.email, role: u.role, is_active: u.is_active,
            created_at: (0, date_1.toIso)(u.created_at),
            tenant_id: partnerId, tenant_name: dto.name,
        };
        return { partner, admin_user: adminUser };
    }
    async getAnalytics(query) {
        const from = query.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
        const to = query.to ?? new Date().toISOString();
        const [tenantStats, userStats, eventStats, topActions, newTenants] = await Promise.all([
            this.dataSource.query(`SELECT COUNT(*)::int AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END)::int AS active
         FROM partners`),
            this.dataSource.query(`SELECT COUNT(*)::int AS total,
                SUM(CASE WHEN is_active THEN 1 ELSE 0 END)::int AS active
         FROM users WHERE role != 'super_admin'`),
            this.dataSource.query(`SELECT COUNT(*)::int AS total FROM audit_logs
         WHERE created_at BETWEEN $1 AND $2`, [from, to]),
            this.dataSource.query(`SELECT action, COUNT(*)::int AS count FROM audit_logs
         WHERE created_at BETWEEN $1 AND $2
         GROUP BY action ORDER BY count DESC LIMIT 10`, [from, to]),
            this.dataSource.query(`SELECT COUNT(*)::int AS total FROM partners
         WHERE created_at BETWEEN $1 AND $2`, [from, to]),
        ]);
        return {
            total_tenants: tenantStats[0].total,
            active_tenants: tenantStats[0].active,
            total_users: userStats[0].total,
            active_users: userStats[0].active,
            events_in_period: eventStats[0].total,
            top_actions: topActions.map((r) => ({ action: r.action, count: r.count })),
            new_tenants_in_period: newTenants[0].total,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        audit_service_1.AuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map