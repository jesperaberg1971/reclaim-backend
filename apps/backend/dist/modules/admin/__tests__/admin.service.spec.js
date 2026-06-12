"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const admin_service_1 = require("../admin.service");
const TENANT_ID = 'tenant-uuid-1';
const USER_ID = 'user-uuid-1';
const ADMIN_ID = 'admin-uuid-1';
function buildService(queryImpl) {
    const queryMock = jest.fn().mockImplementation((sql, params) => queryImpl(sql, params));
    const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
    const ds = { query: queryMock };
    return {
        service: new admin_service_1.AdminService(ds, mockAudit),
        queryMock,
        mockAudit,
    };
}
beforeEach(() => jest.clearAllMocks());
describe('AdminService.listTenants', () => {
    const tenantRow = {
        id: TENANT_ID, name: 'Test Firm', tax_code: '0123456789',
        is_active: true, created_at: new Date('2026-01-01'),
        client_count: 3, user_count: 5, subscription_tier: 'small',
    };
    test('returns paginated list of tenants', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('COUNT(*)'))
                return Promise.resolve([{ total: '1' }]);
            return Promise.resolve([tenantRow]);
        });
        const result = await service.listTenants({});
        expect(result.total).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBe(TENANT_ID);
        expect(result.items[0].client_count).toBe(3);
    });
    test('filters by activeOnly', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.listTenants({ activeOnly: true });
        expect(queryMock.mock.calls[0][0]).toContain('is_active = true');
    });
    test('filters by search term (ILIKE)', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.listTenants({ search: 'acme' });
        const sql = queryMock.mock.calls[0][0];
        expect(sql).toContain('ILIKE');
        expect(queryMock.mock.calls[0][1]).toContain('%acme%');
    });
});
describe('AdminService.getTenant', () => {
    test('throws NotFoundException when tenant not found', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.getTenant(TENANT_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns full tenant detail', async () => {
        const row = {
            id: TENANT_ID, name: 'T', tax_code: '123', is_active: true,
            policies: { meal_cap_vnd: 500000 }, created_at: new Date(),
            client_count: 2, user_count: 4, subscription_tier: 'micro',
            monthly_price_vnd: '1000000', next_billing_date: new Date('2026-07-01'),
        };
        const { service } = buildService(() => Promise.resolve([row]));
        const result = await service.getTenant(TENANT_ID);
        expect(result.id).toBe(TENANT_ID);
        expect(result.policies).toEqual({ meal_cap_vnd: 500000 });
        expect(typeof result.monthly_price_vnd).toBe('string');
    });
});
describe('AdminService.createTenant', () => {
    test('throws ConflictException if name/tax_code already exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners WHERE name'))
                return Promise.resolve([{ id: 'existing' }]);
            return Promise.resolve([]);
        });
        await expect(service.createTenant({ name: 'Existing', tax_code: '111' }, ADMIN_ID)).rejects.toThrow(common_1.ConflictException);
    });
    test('inserts new partner and logs audit event', async () => {
        const newId = 'new-tenant-id';
        let insertCalled = false;
        const { service, mockAudit } = buildService((sql) => {
            if (sql.includes('FROM partners WHERE name'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO partners')) {
                insertCalled = true;
                return Promise.resolve([{ id: newId }]);
            }
            return Promise.resolve([{
                    id: newId, name: 'New Firm', tax_code: '999', is_active: true, policies: {},
                    created_at: new Date(), client_count: 0, user_count: 0,
                    subscription_tier: null, monthly_price_vnd: null, next_billing_date: null,
                }]);
        });
        const result = await service.createTenant({ name: 'New Firm', tax_code: '999' }, ADMIN_ID);
        expect(insertCalled).toBe(true);
        expect(result.id).toBe(newId);
        expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'partner_created' }));
    });
});
describe('AdminService.updateTenant', () => {
    test('returns existing tenant unchanged when no fields provided', async () => {
        const row = {
            id: TENANT_ID, name: 'T', tax_code: '1', is_active: true,
            policies: {}, created_at: new Date(), client_count: 0, user_count: 0,
            subscription_tier: null, monthly_price_vnd: null, next_billing_date: null,
        };
        const { service } = buildService(() => Promise.resolve([row]));
        const result = await service.updateTenant(TENANT_ID, {}, ADMIN_ID);
        expect(result.id).toBe(TENANT_ID);
    });
    test('throws NotFoundException if tenant not found on update', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE partners'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.updateTenant(TENANT_ID, { is_active: false }, ADMIN_ID)).rejects.toThrow(common_1.NotFoundException);
    });
});
describe('AdminService.listUsers', () => {
    const userRow = {
        id: USER_ID, email: 'u@example.com', role: 'partner_admin',
        is_active: true, created_at: new Date(),
        tenant_id: TENANT_ID, tenant_name: 'Test Firm',
    };
    test('returns paginated list', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('COUNT(*)'))
                return Promise.resolve([{ total: '1' }]);
            return Promise.resolve([userRow]);
        });
        const result = await service.listUsers({});
        expect(result.total).toBe(1);
        expect(result.items[0].email).toBe('u@example.com');
    });
    test('filters by tenantId', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.listUsers({ tenantId: TENANT_ID });
        expect(queryMock.mock.calls[0][1]).toContain(TENANT_ID);
    });
    test('filters by role', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.listUsers({ role: 'employee' });
        const sql = queryMock.mock.calls[0][0];
        expect(sql).toContain(`u.role`);
    });
});
describe('AdminService.updateUser', () => {
    test('throws ConflictException when no fields to update', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.updateUser(USER_ID, {}, ADMIN_ID)).rejects.toThrow(common_1.ConflictException);
    });
    test('throws NotFoundException when user not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.updateUser(USER_ID, { is_active: false }, ADMIN_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns updated user summary', async () => {
        const row = {
            id: USER_ID, email: 'u@e.com', role: 'partner_admin', is_active: false,
            created_at: new Date(), tenant_id: TENANT_ID, tenant_name: 'T',
        };
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE users'))
                return Promise.resolve([{ id: USER_ID }]);
            return Promise.resolve([row]);
        });
        const result = await service.updateUser(USER_ID, { is_active: false }, ADMIN_ID);
        expect(result.is_active).toBe(false);
    });
});
describe('AdminService.adminResetPassword', () => {
    test('throws NotFoundException when user not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.adminResetPassword(USER_ID, 'newPass123', ADMIN_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('updates password_hash when user exists', async () => {
        let updateCalled = false;
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([{ id: USER_ID }]);
            if (sql.includes('UPDATE users SET password_hash')) {
                updateCalled = true;
                return Promise.resolve([]);
            }
            return Promise.resolve([]);
        });
        await service.adminResetPassword(USER_ID, 'newSecure456', ADMIN_ID);
        expect(updateCalled).toBe(true);
    });
});
describe('AdminService.getAuditLogs', () => {
    const logRow = {
        id: 'log-1', tenant_id: TENANT_ID, user_id: USER_ID,
        action: 'login', resource_type: null, resource_id: null,
        ip_address: '127.0.0.1', metadata: { role: 'partner_admin' },
        created_at: new Date(),
    };
    test('returns paginated audit logs', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('COUNT(*)'))
                return Promise.resolve([{ total: '1' }]);
            return Promise.resolve([logRow]);
        });
        const result = await service.getAuditLogs({});
        expect(result.total).toBe(1);
        expect(result.items[0].action).toBe('login');
    });
    test('applies tenantId filter', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.getAuditLogs({ tenantId: TENANT_ID });
        expect(queryMock.mock.calls[0][1]).toContain(TENANT_ID);
    });
    test('applies date range filter', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([{ total: '0' }]));
        await service.getAuditLogs({ from: '2026-01-01', to: '2026-06-01' });
        const sql = queryMock.mock.calls[0][0];
        expect(sql).toContain('created_at >=');
        expect(sql).toContain('created_at <=');
    });
});
describe('AdminService.getAnalytics', () => {
    function buildAnalyticsService() {
        let callIdx = 0;
        const responses = [
            [{ total: 5, active: 4 }],
            [{ total: 20, active: 18 }],
            [{ total: 350 }],
            [{ action: 'login', count: 100 }, { action: 'erp_export', count: 50 }],
            [{ total: 2 }],
        ];
        return buildService(() => Promise.resolve(responses[callIdx++] ?? []));
    }
    test('returns correct aggregated analytics', async () => {
        const { service } = buildAnalyticsService();
        const result = await service.getAnalytics({});
        expect(result.total_tenants).toBe(5);
        expect(result.active_tenants).toBe(4);
        expect(result.total_users).toBe(20);
        expect(result.active_users).toBe(18);
        expect(result.events_in_period).toBe(350);
        expect(result.top_actions).toHaveLength(2);
        expect(result.top_actions[0].action).toBe('login');
        expect(result.new_tenants_in_period).toBe(2);
    });
});
describe('AdminService.bulkActionTenants', () => {
    test('returns 0 affected when ids is empty', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.bulkActionTenants({ action: 'activate', ids: [] }, ADMIN_ID);
        expect(result.affected).toBe(0);
    });
    test('activates multiple tenants', async () => {
        const ids = ['t1', 't2'];
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('UPDATE partners'))
                return Promise.resolve(ids.map(id => ({ id })));
            return Promise.resolve([]);
        });
        const result = await service.bulkActionTenants({ action: 'activate', ids }, ADMIN_ID);
        expect(result.affected).toBe(2);
        expect(queryMock.mock.calls[0][1][0]).toBe(true);
    });
    test('deactivates multiple tenants', async () => {
        const ids = ['t1'];
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('UPDATE partners'))
                return Promise.resolve([{ id: 't1' }]);
            return Promise.resolve([]);
        });
        const result = await service.bulkActionTenants({ action: 'deactivate', ids }, ADMIN_ID);
        expect(result.affected).toBe(1);
        expect(queryMock.mock.calls[0][1][0]).toBe(false);
    });
});
describe('AdminService.bulkActionUsers', () => {
    test('returns 0 affected when ids is empty', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.bulkActionUsers({ action: 'deactivate', ids: [] }, ADMIN_ID);
        expect(result.affected).toBe(0);
    });
    test('activates users and skips super_admin via SQL constraint', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('UPDATE users'))
                return Promise.resolve([{ id: 'u1' }, { id: 'u2' }]);
            return Promise.resolve([]);
        });
        const result = await service.bulkActionUsers({ action: 'activate', ids: ['u1', 'u2'] }, ADMIN_ID);
        expect(result.affected).toBe(2);
        const sql = queryMock.mock.calls[0][0];
        expect(sql).toContain("role != 'super_admin'");
    });
});
describe('AdminService.provisionTenant', () => {
    const dto = { name: 'New Corp', tax_code: '9999', admin_email: 'admin@new.com', admin_password: 'pass1234' };
    test('throws ConflictException if partner name/tax already exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners WHERE name'))
                return Promise.resolve([{ id: 'existing' }]);
            return Promise.resolve([]);
        });
        await expect(service.provisionTenant(dto, ADMIN_ID)).rejects.toThrow(common_1.ConflictException);
    });
    test('throws ConflictException if admin email already registered', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM partners WHERE name'))
                return Promise.resolve([]);
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([{ id: USER_ID }]);
            return Promise.resolve([]);
        });
        await expect(service.provisionTenant(dto, ADMIN_ID)).rejects.toThrow(common_1.ConflictException);
    });
    test('creates partner + admin user in one call', async () => {
        const newPartnerId = 'new-partner-id';
        const { service, mockAudit } = buildService((sql) => {
            if (sql.includes('FROM partners WHERE name'))
                return Promise.resolve([]);
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO partners'))
                return Promise.resolve([{ id: newPartnerId }]);
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([{
                        id: 'new-user-id', email: dto.admin_email, role: 'partner_admin',
                        is_active: true, created_at: new Date(),
                    }]);
            return Promise.resolve([{
                    id: newPartnerId, name: dto.name, tax_code: dto.tax_code, is_active: true,
                    policies: {}, created_at: new Date(), client_count: 0, user_count: 0,
                    subscription_tier: null, monthly_price_vnd: null, next_billing_date: null,
                }]);
        });
        const result = await service.provisionTenant(dto, ADMIN_ID);
        expect(result.partner.id).toBe(newPartnerId);
        expect(result.admin_user.email).toBe(dto.admin_email);
        expect(result.admin_user.role).toBe('partner_admin');
        expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({
            action: 'partner_created',
            metadata: expect.objectContaining({ provisioned: true }),
        }));
    });
});
describe('AdminService.createAdminUser', () => {
    test('throws ConflictException if email already registered', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([{ id: USER_ID }]);
            return Promise.resolve([]);
        });
        await expect(service.createAdminUser({ email: 'existing@e.com', password: 'pass1234' }, ADMIN_ID)).rejects.toThrow(common_1.ConflictException);
    });
    test('creates super_admin user and logs audit', async () => {
        const { service, mockAudit } = buildService((sql) => {
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([{
                        id: 'new-admin', email: 'admin@e.com', role: 'super_admin',
                        is_active: true, created_at: new Date(),
                    }]);
            return Promise.resolve([]);
        });
        const result = await service.createAdminUser({ email: 'admin@e.com', password: 'pass1234' }, ADMIN_ID);
        expect(result.role).toBe('super_admin');
        expect(result.tenant_id).toBeNull();
        expect(mockAudit.log).toHaveBeenCalled();
    });
});
//# sourceMappingURL=admin.service.spec.js.map