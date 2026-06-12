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
exports.PolicyService = exports.DEFAULT_POLICY = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const redis_service_1 = require("../../common/redis/redis.service");
const approval_chain_service_1 = require("../approval/approval-chain.service");
const audit_service_1 = require("../../common/audit/audit.service");
const POLICY_CACHE_TTL = 300;
exports.DEFAULT_POLICY = {
    meal_cap_vnd: 150_000,
    per_diem_daily_vnd: 300_000,
    welfare_monthly_cap_vnd: 3_000_000,
    personal_card_limit_vnd: 5_000_000,
    allowed_categories: [],
    require_original_receipt: false,
    require_manager_approval: false,
    approval_escalation_hours: 0,
};
const POLICY_FIELDS = [
    'meal_cap_vnd', 'per_diem_daily_vnd',
    'welfare_monthly_cap_vnd', 'personal_card_limit_vnd',
    'allowed_categories', 'require_original_receipt',
    'require_manager_approval', 'approval_escalation_hours',
];
let PolicyService = class PolicyService {
    constructor(dataSource, redisService, approvalChainService, auditService) {
        this.dataSource = dataSource;
        this.redisService = redisService;
        this.approvalChainService = approvalChainService;
        this.auditService = auditService;
    }
    async getPolicy(tenantId) {
        const cacheKey = `cache:policy:${tenantId}`;
        const cached = await this.redisService.cacheGet(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`SELECT p.name, p.policies,
                (SELECT created_at FROM audit_logs
                 WHERE tenant_id = $1 AND action = 'policy_update'
                 ORDER BY created_at DESC LIMIT 1) AS last_policy_update
         FROM partners p WHERE p.id = $1`, [tenantId]);
            if (!row)
                throw new common_1.NotFoundException('Partner not found');
            return {
                partner_name: row.name,
                policy: { ...exports.DEFAULT_POLICY, ...(row.policies ?? {}) },
                effective_since: row.last_policy_update
                    ? new Date(row.last_policy_update).toISOString()
                    : null,
            };
        });
        await this.redisService.cacheSet(cacheKey, JSON.stringify(result), POLICY_CACHE_TTL);
        return result;
    }
    async updatePolicy(tenantId, userId, dto) {
        let managerApprovalDisabled = false;
        const result = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [row] = await manager.query(`SELECT name, policies FROM partners WHERE id = $1`, [tenantId]);
            if (!row)
                throw new common_1.NotFoundException('Partner not found');
            const current = { ...exports.DEFAULT_POLICY, ...(row.policies ?? {}) };
            const changes = {};
            for (const f of POLICY_FIELDS) {
                if (dto[f] !== undefined)
                    changes[f] = dto[f];
            }
            if (!Object.keys(changes).length) {
                return { partner_name: row.name, policy: current, effective_since: null, changed: false };
            }
            const merged = { ...current, ...changes };
            if (current.require_manager_approval && !merged.require_manager_approval) {
                managerApprovalDisabled = true;
            }
            if (merged.meal_cap_vnd > merged.welfare_monthly_cap_vnd) {
                throw new common_1.BadRequestException(`meal_cap_vnd (${merged.meal_cap_vnd}) cannot exceed welfare_monthly_cap_vnd (${merged.welfare_monthly_cap_vnd})`);
            }
            const previous = {};
            for (const f of POLICY_FIELDS) {
                if (f in changes)
                    previous[f] = current[f];
            }
            await manager.query(`UPDATE partners SET policies = $1 WHERE id = $2`, [JSON.stringify(merged), tenantId]);
            await manager.query(`INSERT INTO policy_versions (partner_id, version_number, snapshot, changed_by)
         SELECT $1,
                COALESCE((SELECT MAX(version_number) FROM policy_versions WHERE partner_id = $1), 0) + 1,
                $2::jsonb, $3`, [tenantId, JSON.stringify(merged), userId]);
            void this.dataSource.query(`INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
         VALUES ($1, $2, 'policy_update', 'partner', $3, $4::jsonb)`, [tenantId, userId, tenantId, JSON.stringify({ previous, changes })]);
            return {
                partner_name: row.name,
                policy: merged,
                effective_since: new Date().toISOString(),
                changed: true,
            };
        });
        if (result.changed) {
            void this.redisService.cacheDelete(`cache:policy:${tenantId}`);
            if (managerApprovalDisabled) {
                void this.approvalChainService.skipManagerStepsForTenant(tenantId);
            }
        }
        return result;
    }
    async getPolicyHistory(tenantId, limit = 10) {
        const rows = await this.dataSource.query(`SELECT created_at, user_id, metadata
       FROM audit_logs
       WHERE tenant_id = $1 AND action = 'policy_update'
       ORDER BY created_at DESC
       LIMIT $2`, [tenantId, limit]);
        return rows.map((r) => ({
            changed_at: new Date(r.created_at).toISOString(),
            user_id: r.user_id ?? null,
            previous: r.metadata?.previous ?? {},
            changes: r.metadata?.changes ?? {},
        }));
    }
    async getPolicyVersions(tenantId) {
        const rows = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT version_number, snapshot, changed_by, created_at
         FROM policy_versions
         WHERE partner_id = $1
         ORDER BY version_number DESC`, [tenantId]);
        });
        return rows.map((r) => ({
            version_number: r.version_number,
            snapshot: { ...exports.DEFAULT_POLICY, ...r.snapshot },
            changed_by: r.changed_by ?? null,
            created_at: new Date(r.created_at).toISOString(),
        }));
    }
    async getPolicyVersion(tenantId, version) {
        const rows = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT version_number, snapshot, changed_by, created_at
         FROM policy_versions
         WHERE partner_id = $1 AND version_number = $2`, [tenantId, version]);
        });
        if (!rows.length)
            throw new common_1.NotFoundException(`Policy version ${version} not found`);
        const r = rows[0];
        return {
            version_number: r.version_number,
            snapshot: { ...exports.DEFAULT_POLICY, ...r.snapshot },
            changed_by: r.changed_by ?? null,
            created_at: new Date(r.created_at).toISOString(),
        };
    }
    async restorePolicyVersion(tenantId, userId, version) {
        const record = await this.getPolicyVersion(tenantId, version);
        const dto = {
            meal_cap_vnd: record.snapshot.meal_cap_vnd,
            per_diem_daily_vnd: record.snapshot.per_diem_daily_vnd,
            welfare_monthly_cap_vnd: record.snapshot.welfare_monthly_cap_vnd,
            personal_card_limit_vnd: record.snapshot.personal_card_limit_vnd,
            allowed_categories: record.snapshot.allowed_categories,
            require_original_receipt: record.snapshot.require_original_receipt,
        };
        return this.updatePolicy(tenantId, userId, dto);
    }
    async getClientPolicy(tenantId, clientId) {
        const partnerPolicy = await this.getPolicy(tenantId);
        const clientRow = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const rows = await manager.query(`SELECT policy_overrides, notes FROM client_policies WHERE client_id = $1`, [clientId]);
            return rows[0] ?? null;
        });
        const overrides = clientRow?.policy_overrides ?? {};
        return {
            client_id: clientId,
            effective_policy: { ...partnerPolicy.policy, ...overrides },
            overrides,
            notes: clientRow?.notes ?? null,
            has_override: !!clientRow,
        };
    }
    async setClientPolicy(tenantId, userId, clientId, dto) {
        const overrides = {};
        for (const f of POLICY_FIELDS) {
            if (dto[f] !== undefined)
                overrides[f] = dto[f];
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [clientRow] = await manager.query(`SELECT id FROM clients WHERE id = $1 AND partner_id = $2`, [clientId, tenantId]);
            if (!clientRow)
                throw new common_1.NotFoundException('Client not found');
            const [partnerRow] = await manager.query(`SELECT policies FROM partners WHERE id = $1`, [tenantId]);
            const basePolicy = { ...exports.DEFAULT_POLICY, ...(partnerRow?.policies ?? {}) };
            const effective = { ...basePolicy, ...overrides };
            if (effective.meal_cap_vnd > effective.welfare_monthly_cap_vnd) {
                throw new common_1.BadRequestException(`meal_cap_vnd (${effective.meal_cap_vnd}) cannot exceed welfare_monthly_cap_vnd (${effective.welfare_monthly_cap_vnd})`);
            }
            await manager.query(`INSERT INTO client_policies (partner_id, client_id, policy_overrides, notes)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT (client_id) DO UPDATE
           SET policy_overrides = EXCLUDED.policy_overrides,
               notes            = EXCLUDED.notes,
               updated_at       = NOW()`, [tenantId, clientId, JSON.stringify(overrides), dto.notes ?? null]);
        });
        void this.auditService.log({
            tenantId,
            userId,
            action: 'client_policy_set',
            resourceType: 'client',
            resourceId: clientId,
            metadata: { overrides },
        });
        return this.getClientPolicy(tenantId, clientId);
    }
    async deleteClientPolicy(tenantId, clientId, userId) {
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            await manager.query(`DELETE FROM client_policies WHERE client_id = $1`, [clientId]);
        });
        void this.auditService.log({
            tenantId,
            userId,
            action: 'client_policy_delete',
            resourceType: 'client',
            resourceId: clientId,
        });
        return { ok: true };
    }
    async listClientPolicies(tenantId) {
        const rows = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT cp.client_id, cp.policy_overrides, cp.notes, c.name AS client_name
         FROM client_policies cp
         JOIN clients c ON c.id = cp.client_id
         WHERE cp.partner_id = $1
         ORDER BY c.name`, [tenantId]);
        });
        const partnerPolicy = await this.getPolicy(tenantId);
        return rows.map((r) => ({
            client_id: r.client_id,
            client_name: r.client_name,
            effective_policy: { ...partnerPolicy.policy, ...(r.policy_overrides ?? {}) },
            overrides: r.policy_overrides ?? {},
            notes: r.notes ?? null,
            has_override: true,
        }));
    }
};
exports.PolicyService = PolicyService;
exports.PolicyService = PolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        redis_service_1.RedisService,
        approval_chain_service_1.ApprovalChainService,
        audit_service_1.AuditService])
], PolicyService);
//# sourceMappingURL=policy.service.js.map