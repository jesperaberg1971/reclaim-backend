"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const policy_service_1 = require("../policy.service");
const TENANT = 'tenant-uuid-1';
const USER = 'user-uuid-1';
function makePartner(overrides = {}) {
    return {
        name: 'Firm A',
        policies: null,
        last_policy_update: null,
        ...overrides,
    };
}
const mockRedis = {
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
const mockApprovalChain = {
    skipManagerStepsForTenant: jest.fn().mockResolvedValue(undefined),
};
const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
function buildService() {
    const queryMock = jest.fn();
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
        query: queryMock,
    };
    return {
        service: new policy_service_1.PolicyService(ds, mockRedis, mockApprovalChain, mockAuditService),
        queryMock,
    };
}
beforeEach(() => jest.clearAllMocks());
describe('PolicyService.getPolicy', () => {
    test('returns DEFAULT_POLICY when policies column is null', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        const result = await service.getPolicy(TENANT);
        expect(result.policy).toEqual(policy_service_1.DEFAULT_POLICY);
        expect(result.partner_name).toBe('Firm A');
        expect(result.effective_since).toBeNull();
    });
    test('effective_since reflects last audit-log timestamp when policy has been updated', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ last_policy_update: new Date('2026-05-20T09:00:00Z') })]);
        });
        const result = await service.getPolicy(TENANT);
        expect(result.effective_since).toMatch(/^2026-05-20/);
    });
    test('merges stored overrides on top of defaults', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ policies: { meal_cap_vnd: 200_000 } })]);
        });
        const result = await service.getPolicy(TENANT);
        expect(result.policy.meal_cap_vnd).toBe(200_000);
        expect(result.policy.per_diem_daily_vnd).toBe(policy_service_1.DEFAULT_POLICY.per_diem_daily_vnd);
        expect(result.policy.welfare_monthly_cap_vnd).toBe(policy_service_1.DEFAULT_POLICY.welfare_monthly_cap_vnd);
    });
    test('throws NotFoundException when partner row is missing', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.getPolicy(TENANT)).rejects.toThrow(common_1.NotFoundException);
    });
});
describe('PolicyService.updatePolicy', () => {
    test('is a no-op and issues no UPDATE when DTO has no fields', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        const result = await service.updatePolicy(TENANT, USER, {});
        const updateCalls = queryMock.mock.calls.filter(([s]) => s.includes('UPDATE partners'));
        expect(updateCalls).toHaveLength(0);
        expect(result.policy).toEqual(policy_service_1.DEFAULT_POLICY);
        expect(result.effective_since).toBeNull();
        expect(result.changed).toBe(false);
    });
    test('applies changes and returns the merged policy', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT INTO audit_logs'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        const result = await service.updatePolicy(TENANT, USER, {
            meal_cap_vnd: 250_000,
            per_diem_daily_vnd: 450_000,
        });
        expect(result.policy.meal_cap_vnd).toBe(250_000);
        expect(result.policy.per_diem_daily_vnd).toBe(450_000);
        expect(result.policy.welfare_monthly_cap_vnd).toBe(policy_service_1.DEFAULT_POLICY.welfare_monthly_cap_vnd);
        expect(result.effective_since).not.toBeNull();
        expect(result.changed).toBe(true);
    });
    test('UPDATE partners receives the fully-merged JSON blob', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT INTO audit_logs'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ policies: { meal_cap_vnd: 180_000 } })]);
        });
        await service.updatePolicy(TENANT, USER, { per_diem_daily_vnd: 500_000 });
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE partners'));
        expect(updateCall).toBeDefined();
        const merged = JSON.parse(updateCall[1][0]);
        expect(merged.per_diem_daily_vnd).toBe(500_000);
        expect(merged.meal_cap_vnd).toBe(180_000);
    });
    test('audit INSERT receives the correct previous and changes metadata', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT INTO audit_logs'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await service.updatePolicy(TENANT, USER, { meal_cap_vnd: 300_000 });
        const auditCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO audit_logs'));
        expect(auditCall).toBeDefined();
        const metadata = JSON.parse(auditCall[1][3]);
        expect(metadata.changes.meal_cap_vnd).toBe(300_000);
        expect(metadata.previous.meal_cap_vnd).toBe(policy_service_1.DEFAULT_POLICY.meal_cap_vnd);
    });
    test('throws NotFoundException when partner row is missing', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.updatePolicy(TENANT, USER, { meal_cap_vnd: 100_000 })).rejects.toThrow(common_1.NotFoundException);
    });
    test('throws BadRequestException when meal_cap_vnd exceeds welfare_monthly_cap_vnd', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await expect(service.updatePolicy(TENANT, USER, {
            meal_cap_vnd: 4_000_000,
            welfare_monthly_cap_vnd: 1_000_000,
        })).rejects.toThrow('meal_cap_vnd');
    });
    test('writes a policy_versions snapshot when changes are applied', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await service.updatePolicy(TENANT, USER, { meal_cap_vnd: 200_000 });
        const versionInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO policy_versions'));
        expect(versionInsert).toBeDefined();
        const snapshot = JSON.parse(versionInsert[1][1]);
        expect(snapshot.meal_cap_vnd).toBe(200_000);
    });
    test('does NOT write policy_versions on no-op update', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await service.updatePolicy(TENANT, USER, {});
        const versionInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO policy_versions'));
        expect(versionInsert).toBeUndefined();
    });
    test('stores allowed_categories array in merged policy', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        const result = await service.updatePolicy(TENANT, USER, {
            allowed_categories: ['travel_allowance', 'welfare_allowance'],
        });
        expect(result.policy.allowed_categories).toEqual(['travel_allowance', 'welfare_allowance']);
        expect(result.changed).toBe(true);
    });
    test('stores require_original_receipt boolean in merged policy', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        const result = await service.updatePolicy(TENANT, USER, { require_original_receipt: true });
        expect(result.policy.require_original_receipt).toBe(true);
    });
});
describe('PolicyService.getPolicyHistory', () => {
    test('maps audit rows to PolicyChangeRecord shape', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValue([{
                created_at: new Date('2026-05-01T10:00:00Z'),
                user_id: USER,
                metadata: { previous: { meal_cap_vnd: 150_000 }, changes: { meal_cap_vnd: 200_000 } },
            }]);
        const history = await service.getPolicyHistory(TENANT);
        expect(history).toHaveLength(1);
        expect(history[0].changed_at).toMatch(/^2026-05-01/);
        expect(history[0].user_id).toBe(USER);
        expect(history[0].changes.meal_cap_vnd).toBe(200_000);
        expect(history[0].previous.meal_cap_vnd).toBe(150_000);
    });
    test('returns empty array when no audit rows exist', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValue([]);
        expect(await service.getPolicyHistory(TENANT)).toEqual([]);
    });
    test('handles rows with null metadata without throwing', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValue([{ created_at: new Date(), user_id: null, metadata: null }]);
        const history = await service.getPolicyHistory(TENANT);
        expect(history[0].previous).toEqual({});
        expect(history[0].changes).toEqual({});
        expect(history[0].user_id).toBeNull();
    });
});
describe('PolicyService.updatePolicy — cache side-effects', () => {
    test('invalidates cache after a successful policy change', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await service.updatePolicy(TENANT, USER, { meal_cap_vnd: 200_000 });
        expect(mockRedis.cacheDelete).toHaveBeenCalledWith(`cache:policy:${TENANT}`);
    });
    test('does NOT invalidate cache on a no-op update (no fields changed)', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner()]);
        });
        await service.updatePolicy(TENANT, USER, {});
        expect(mockRedis.cacheDelete).not.toHaveBeenCalled();
    });
});
describe('PolicyService.updatePolicy — manager-approval side-effect', () => {
    test('calls skipManagerStepsForTenant when require_manager_approval is disabled', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ policies: { require_manager_approval: true } })]);
        });
        await service.updatePolicy(TENANT, USER, { require_manager_approval: false });
        expect(mockApprovalChain.skipManagerStepsForTenant).toHaveBeenCalledWith(TENANT);
    });
    test('does NOT call skipManagerStepsForTenant when require_manager_approval stays enabled', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ policies: { require_manager_approval: true } })]);
        });
        await service.updatePolicy(TENANT, USER, { require_manager_approval: true });
        expect(mockApprovalChain.skipManagerStepsForTenant).not.toHaveBeenCalled();
    });
    test('does NOT call skipManagerStepsForTenant when require_manager_approval is not in the DTO', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([makePartner({ policies: { require_manager_approval: true } })]);
        });
        await service.updatePolicy(TENANT, USER, { meal_cap_vnd: 200_000 });
        expect(mockApprovalChain.skipManagerStepsForTenant).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=policy.service.spec.js.map