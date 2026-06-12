"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const policy_service_1 = require("../policy.service");
const TENANT = 'tenant-uuid-1';
const USER = 'user-uuid-1';
const CLIENT = 'client-uuid-1';
const mockRedis = {
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
function makePartner(overrides = {}) {
    return {
        name: 'Firm A',
        policies: null,
        last_policy_update: null,
        ...overrides,
    };
}
function buildService(overrideImpl) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (overrideImpl)
            return overrideImpl(sql);
        return Promise.resolve([]);
    });
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
        query: queryMock,
    };
    const mockApprovalChain = { skipManagerStepsForTenant: jest.fn().mockResolvedValue(undefined) };
    return {
        service: new policy_service_1.PolicyService(ds, mockRedis, mockApprovalChain, mockAuditService),
        queryMock,
    };
}
beforeEach(() => jest.clearAllMocks());
describe('PolicyService.getClientPolicy', () => {
    test('returns partner policy with has_override=false when no client row exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('client_policies'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.getClientPolicy(TENANT, CLIENT);
        expect(result.has_override).toBe(false);
        expect(result.effective_policy).toEqual(policy_service_1.DEFAULT_POLICY);
        expect(result.overrides).toEqual({});
    });
    test('merges client override on top of partner policy', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('client_policies'))
                return Promise.resolve([{
                        policy_overrides: { meal_cap_vnd: 80_000 },
                        notes: 'Lower cap for this client',
                    }]);
            return Promise.resolve([]);
        });
        const result = await service.getClientPolicy(TENANT, CLIENT);
        expect(result.has_override).toBe(true);
        expect(result.effective_policy.meal_cap_vnd).toBe(80_000);
        expect(result.effective_policy.per_diem_daily_vnd).toBe(policy_service_1.DEFAULT_POLICY.per_diem_daily_vnd);
        expect(result.overrides).toEqual({ meal_cap_vnd: 80_000 });
        expect(result.notes).toBe('Lower cap for this client');
    });
    test('override can set allowed_categories to a subset', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('client_policies'))
                return Promise.resolve([{
                        policy_overrides: { allowed_categories: ['travel_allowance'] },
                        notes: null,
                    }]);
            return Promise.resolve([]);
        });
        const result = await service.getClientPolicy(TENANT, CLIENT);
        expect(result.effective_policy.allowed_categories).toEqual(['travel_allowance']);
    });
});
describe('PolicyService.setClientPolicy', () => {
    test('throws NotFoundException when client does not belong to tenant', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients'))
                return Promise.resolve([]);
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            return Promise.resolve([]);
        });
        await expect(service.setClientPolicy(TENANT, USER, CLIENT, { meal_cap_vnd: 100_000 })).rejects.toThrow(common_1.NotFoundException);
    });
    test('throws BadRequestException when effective meal_cap > welfare_monthly_cap', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            return Promise.resolve([]);
        });
        await expect(service.setClientPolicy(TENANT, USER, CLIENT, {
            meal_cap_vnd: 5_000_000,
            welfare_monthly_cap_vnd: 500_000,
        })).rejects.toThrow(common_1.BadRequestException);
    });
    test('inserts client_policy row with correct override values', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('client_policies'))
                return Promise.resolve([{
                        policy_overrides: { meal_cap_vnd: 120_000 },
                        notes: null,
                    }]);
            return Promise.resolve([]);
        });
        await service.setClientPolicy(TENANT, USER, CLIENT, {
            meal_cap_vnd: 120_000,
            notes: 'Custom cap',
        });
        const upsertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO client_policies'));
        expect(upsertCall).toBeDefined();
        const overrides = JSON.parse(upsertCall[1][2]);
        expect(overrides.meal_cap_vnd).toBe(120_000);
        expect(upsertCall[1][3]).toBe('Custom cap');
    });
    test('only stores explicitly provided fields in overrides (sparse delta)', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('client_policies'))
                return Promise.resolve([{
                        policy_overrides: { per_diem_daily_vnd: 250_000 },
                        notes: null,
                    }]);
            return Promise.resolve([]);
        });
        await service.setClientPolicy(TENANT, USER, CLIENT, { per_diem_daily_vnd: 250_000 });
        const upsertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO client_policies'));
        const overrides = JSON.parse(upsertCall[1][2]);
        expect(Object.keys(overrides)).toEqual(['per_diem_daily_vnd']);
        expect(overrides.meal_cap_vnd).toBeUndefined();
    });
});
describe('PolicyService.deleteClientPolicy', () => {
    test('issues DELETE and returns { ok: true }', async () => {
        const { service, queryMock } = buildService();
        const result = await service.deleteClientPolicy(TENANT, CLIENT);
        expect(result).toEqual({ ok: true });
        const deleteCall = queryMock.mock.calls.find(([s]) => s.includes('DELETE FROM client_policies'));
        expect(deleteCall).toBeDefined();
        expect(deleteCall[1][0]).toBe(CLIENT);
    });
    test('succeeds even when no override exists (no-op DELETE)', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.deleteClientPolicy(TENANT, CLIENT)).resolves.toEqual({ ok: true });
    });
});
describe('PolicyService.getPolicyVersions', () => {
    test('returns versions merged with DEFAULT_POLICY ordered by version desc', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM policy_versions') && !sql.includes('version_number = $2')) {
                return Promise.resolve([
                    { version_number: 2, snapshot: { meal_cap_vnd: 200_000 }, changed_by: USER, created_at: new Date('2026-06-05') },
                    { version_number: 1, snapshot: { meal_cap_vnd: 150_000 }, changed_by: USER, created_at: new Date('2026-06-01') },
                ]);
            }
            return Promise.resolve([]);
        });
        const versions = await service.getPolicyVersions(TENANT);
        expect(versions).toHaveLength(2);
        expect(versions[0].version_number).toBe(2);
        expect(versions[0].snapshot.meal_cap_vnd).toBe(200_000);
        expect(versions[0].snapshot.per_diem_daily_vnd).toBe(policy_service_1.DEFAULT_POLICY.per_diem_daily_vnd);
        expect(versions[0].changed_by).toBe(USER);
    });
    test('returns empty array when no versions exist', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const versions = await service.getPolicyVersions(TENANT);
        expect(versions).toEqual([]);
    });
});
describe('PolicyService.getPolicyVersion', () => {
    test('returns the specific version record', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('version_number = $2')) {
                return Promise.resolve([{
                        version_number: 3,
                        snapshot: { meal_cap_vnd: 250_000 },
                        changed_by: null,
                        created_at: new Date('2026-06-09'),
                    }]);
            }
            return Promise.resolve([]);
        });
        const record = await service.getPolicyVersion(TENANT, 3);
        expect(record.version_number).toBe(3);
        expect(record.snapshot.meal_cap_vnd).toBe(250_000);
        expect(record.changed_by).toBeNull();
    });
    test('throws NotFoundException for non-existent version', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.getPolicyVersion(TENANT, 99)).rejects.toThrow(common_1.NotFoundException);
    });
});
describe('PolicyService.restorePolicyVersion', () => {
    test('applies the snapshot as a new update, returning a PolicyResponse with changed=true', async () => {
        const snapshotPolicies = { meal_cap_vnd: 120_000 };
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('version_number = $2')) {
                return Promise.resolve([{
                        version_number: 1,
                        snapshot: snapshotPolicies,
                        changed_by: null,
                        created_at: new Date('2026-05-01'),
                    }]);
            }
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.restorePolicyVersion(TENANT, USER, 1);
        expect(result.changed).toBe(true);
        expect(result.policy.meal_cap_vnd).toBe(120_000);
    });
    test('restored policy is persisted via UPDATE partners', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('version_number = $2')) {
                return Promise.resolve([{
                        version_number: 2,
                        snapshot: { meal_cap_vnd: 250_000, per_diem_daily_vnd: 400_000 },
                        changed_by: null,
                        created_at: new Date(),
                    }]);
            }
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            if (sql.includes('UPDATE') || sql.includes('INSERT'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await service.restorePolicyVersion(TENANT, USER, 2);
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE partners'));
        expect(updateCall).toBeDefined();
        const merged = JSON.parse(updateCall[1][0]);
        expect(merged.meal_cap_vnd).toBe(250_000);
        expect(merged.per_diem_daily_vnd).toBe(400_000);
    });
});
describe('PolicyService.listClientPolicies', () => {
    test('returns merged effective policies for all clients with overrides', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM client_policies cp')) {
                return Promise.resolve([
                    { client_id: 'c-1', policy_overrides: { meal_cap_vnd: 80_000 }, notes: 'Low cap', client_name: 'Client A' },
                    { client_id: 'c-2', policy_overrides: {}, notes: null, client_name: 'Client B' },
                ]);
            }
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            return Promise.resolve([]);
        });
        const list = await service.listClientPolicies(TENANT);
        expect(list).toHaveLength(2);
        const clientA = list.find(c => c.client_id === 'c-1');
        expect(clientA.effective_policy.meal_cap_vnd).toBe(80_000);
        expect(clientA.notes).toBe('Low cap');
        expect(clientA.has_override).toBe(true);
        const clientB = list.find(c => c.client_id === 'c-2');
        expect(clientB.effective_policy.meal_cap_vnd).toBe(150_000);
        expect(clientB.notes).toBeNull();
    });
    test('returns empty array when no client overrides exist', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM client_policies cp'))
                return Promise.resolve([]);
            if (sql.includes('FROM partners'))
                return Promise.resolve([makePartner()]);
            return Promise.resolve([]);
        });
        const list = await service.listClientPolicies(TENANT);
        expect(list).toEqual([]);
    });
});
//# sourceMappingURL=policy-client.service.spec.js.map