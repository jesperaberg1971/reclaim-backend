"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const setup_service_1 = require("../setup.service");
const TENANT = 'partner-uuid-1';
const CLIENT = 'client-uuid-1';
const USER = 'user-uuid-1';
const mockJwt = { sign: jest.fn().mockReturnValue('tok') };
const mockConfig = { get: jest.fn().mockReturnValue('secret') };
const mockRedis = {
    cacheGet: jest.fn(),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
function buildService(queryImpl) {
    const queryMock = jest.fn().mockImplementation((sql, params) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        return queryImpl(sql, params);
    });
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
        query: queryMock,
    };
    const service = new setup_service_1.SetupService(ds, mockJwt, mockConfig, mockRedis);
    return { service, queryMock };
}
beforeEach(() => jest.clearAllMocks());
describe('SetupService.createPartner', () => {
    test('creates partner + admin user and returns JWT', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO partners'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.createPartner({
            firm_name: 'ABC Firm', tax_code: '1234567890',
            admin_email: 'admin@abc.vn', admin_password: 'password1',
        });
        expect(result.accessToken).toBe('tok');
        expect(result.partner_id).toEqual(expect.any(String));
        expect(mockJwt.sign).toHaveBeenCalledWith(expect.objectContaining({ role: 'partner_admin' }), expect.any(Object));
        const insertPartner = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO partners'));
        expect(insertPartner).toBeDefined();
    });
    test('throws ConflictException on duplicate firm', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([{ id: 'existing' }]);
            return Promise.resolve([]);
        });
        await expect(service.createPartner({
            firm_name: 'ABC Firm', tax_code: '1234567890',
            admin_email: 'admin@abc.vn', admin_password: 'password1',
        })).rejects.toThrow(common_1.ConflictException);
    });
    test('uses canonical DEFAULT_POLICY when seeding partner policies', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await service.createPartner({
            firm_name: 'XYZ', tax_code: '9876543210',
            admin_email: 'x@y.vn', admin_password: 'password1',
        });
        const insertPartner = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO partners'));
        const policyArg = insertPartner[1][3];
        const policy = JSON.parse(policyArg);
        expect(policy).toHaveProperty('allowed_categories');
        expect(policy).toHaveProperty('require_manager_approval');
        expect(policy).toHaveProperty('approval_escalation_hours');
    });
});
describe('SetupService.createClient', () => {
    test('creates client and returns id + name', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO clients'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.createClient(TENANT, { name: 'Cty XYZ' });
        expect(result.name).toBe('Cty XYZ');
        expect(result.id).toEqual(expect.any(String));
    });
    test('throws ConflictException on duplicate client name', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            return Promise.resolve([]);
        });
        await expect(service.createClient(TENANT, { name: 'Cty XYZ' })).rejects.toThrow(common_1.ConflictException);
    });
});
describe('SetupService.createClientAdmin', () => {
    test('creates client_admin user for valid client', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.createClientAdmin(TENANT, {
            client_id: CLIENT, email: 'ca@xyz.vn', password: 'password1',
        });
        expect(result.client_id).toBe(CLIENT);
        expect(result.email).toBe('ca@xyz.vn');
        const insertUser = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO users') && s.includes('client_admin'));
        expect(insertUser).toBeDefined();
    });
    test('throws BadRequestException when client not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.createClientAdmin(TENANT, {
            client_id: 'bad-client', email: 'x@y.vn', password: 'password1',
        })).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws ConflictException on duplicate email', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([{ id: USER }]);
            return Promise.resolve([]);
        });
        await expect(service.createClientAdmin(TENANT, {
            client_id: CLIENT, email: 'dup@xyz.vn', password: 'password1',
        })).rejects.toThrow(common_1.ConflictException);
    });
});
describe('SetupService.createEmployee', () => {
    test('creates employee record + user account', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM employees'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.createEmployee(TENANT, {
            client_id: CLIENT, full_name: 'Nguyễn A', employee_code: 'NV001',
            email: 'a@b.vn', password: 'password1',
        });
        expect(result.full_name).toBe('Nguyễn A');
        expect(result.employee_id).toEqual(expect.any(String));
        expect(result.user_id).toEqual(expect.any(String));
        const updateClient = queryMock.mock.calls.find(([s]) => s.includes('UPDATE clients') && s.includes('employee_count'));
        expect(updateClient).toBeDefined();
    });
    test('throws ConflictException on duplicate employee code', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM employees'))
                return Promise.resolve([{ id: 'emp1' }]);
            return Promise.resolve([]);
        });
        await expect(service.createEmployee(TENANT, {
            client_id: CLIENT, full_name: 'B', employee_code: 'NV001', email: 'b@c.vn', password: 'password1',
        })).rejects.toThrow(common_1.ConflictException);
    });
});
describe('SetupService.bulkImportEmployees', () => {
    test('all succeed → succeeded list full, failed empty', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM employees'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.bulkImportEmployees(TENANT, {
            client_id: CLIENT,
            employees: [
                { full_name: 'A', employee_code: 'NV001', email: 'a@b.vn', password: 'password1' },
                { full_name: 'B', employee_code: 'NV002', email: 'b@c.vn', password: 'password1' },
            ],
        });
        expect(result.succeeded).toHaveLength(2);
        expect(result.failed).toHaveLength(0);
        expect(result.total).toBe(2);
    });
    test('partial failure — bad employee captured, rest succeed', async () => {
        let empCallCount = 0;
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            if (sql.includes('SELECT id FROM employees')) {
                empCallCount++;
                return empCallCount === 1 ? Promise.resolve([{ id: 'dup' }]) : Promise.resolve([]);
            }
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.bulkImportEmployees(TENANT, {
            client_id: CLIENT,
            employees: [
                { full_name: 'Dup', employee_code: 'NV001', email: 'dup@b.vn', password: 'password1' },
                { full_name: 'OK', employee_code: 'NV002', email: 'ok@b.vn', password: 'password1' },
            ],
        });
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].full_name).toBe('Dup');
        expect(result.succeeded).toHaveLength(1);
        expect(result.succeeded[0].full_name).toBe('OK');
    });
});
describe('SetupService.provision', () => {
    test('creates partner + client + employee atomically', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.provision({
            firm_name: 'Firm XYZ', tax_code: '0123456789',
            admin_email: 'admin@xyz.vn', admin_password: 'password1',
            clients: [{
                    name: 'Cty ABC',
                    admin_email: 'ca@abc.vn', admin_password: 'password1',
                    employees: [{ full_name: 'NV A', employee_code: 'NV001', email: 'nva@abc.vn', password: 'password1' }],
                }],
        });
        expect(result.partner_id).toEqual(expect.any(String));
        expect(result.access_token).toBe('tok');
        expect(result.clients).toHaveLength(1);
        expect(result.clients[0].name).toBe('Cty ABC');
        expect(result.clients[0].admin_user_id).toBeTruthy();
        expect(result.clients[0].employees).toHaveLength(1);
        const partnerInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO partners'));
        expect(partnerInsert).toBeDefined();
        const clientAdminInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO users') && s.includes('client_admin'));
        expect(clientAdminInsert).toBeDefined();
    });
    test('throws ConflictException when partner already exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([{ id: 'existing' }]);
            return Promise.resolve([]);
        });
        await expect(service.provision({
            firm_name: 'Existing', tax_code: '0000000000',
            admin_email: 'x@y.vn', admin_password: 'password1',
        })).rejects.toThrow(common_1.ConflictException);
    });
    test('provision with no clients still creates partner + admin', async () => {
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM partners'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.provision({
            firm_name: 'Solo', tax_code: '1111111111',
            admin_email: 'solo@x.vn', admin_password: 'password1',
        });
        expect(result.clients).toHaveLength(0);
        expect(result.partner_id).toBeTruthy();
        const partnerInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO partners'));
        expect(partnerInsert).toBeDefined();
    });
});
describe('SetupService.createInvite', () => {
    test('stores invite in Redis and returns token + url', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            return Promise.resolve([]);
        });
        const result = await service.createInvite(TENANT, {
            email: 'new@emp.vn', role: 'employee', client_id: CLIENT,
        });
        expect(result.token).toHaveLength(64);
        expect(result.invite_url).toContain(result.token);
        expect(result.expires_at).toBeTruthy();
        expect(mockRedis.cacheSet).toHaveBeenCalledWith(expect.stringContaining('invite:'), expect.stringContaining('new@emp.vn'), 48 * 3600);
    });
    test('stores role and clientId in Redis payload', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM clients'))
                return Promise.resolve([{ id: CLIENT }]);
            return Promise.resolve([]);
        });
        await service.createInvite(TENANT, { email: 'x@y.vn', role: 'client_admin', client_id: CLIENT });
        const [, storedJson] = mockRedis.cacheSet.mock.calls[0];
        const stored = JSON.parse(storedJson);
        expect(stored.role).toBe('client_admin');
        expect(stored.clientId).toBe(CLIENT);
        expect(stored.partnerId).toBe(TENANT);
    });
});
describe('SetupService.redeemInvite', () => {
    const validInvite = {
        email: 'invite@emp.vn', role: 'employee', partnerId: TENANT, clientId: CLIENT,
    };
    const validClientAdminInvite = {
        email: 'ca@emp.vn', role: 'client_admin', partnerId: TENANT, clientId: CLIENT,
    };
    test('employee redemption creates employee + user + returns JWT', async () => {
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(validInvite));
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id FROM employees'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.redeemInvite({
            token: 'abc', password: 'password1', full_name: 'Nguyễn A', employee_code: 'NV001',
        });
        expect(result.access_token).toBe('tok');
        expect(result.role).toBe('employee');
        expect(mockRedis.cacheDelete).toHaveBeenCalled();
        const empInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO employees'));
        expect(empInsert).toBeDefined();
        const userInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO users') && s.includes('employee'));
        expect(userInsert).toBeDefined();
    });
    test('client_admin redemption creates only a user (no employee record)', async () => {
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(validClientAdminInvite));
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.redeemInvite({ token: 'abc', password: 'password1' });
        expect(result.role).toBe('client_admin');
        const empInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO employees'));
        expect(empInsert).toBeUndefined();
        const userInsert = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO users') && s.includes('client_admin'));
        expect(userInsert).toBeDefined();
    });
    test('throws BadRequestException when token not found in Redis', async () => {
        mockRedis.cacheGet.mockResolvedValueOnce(null);
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.redeemInvite({ token: 'expired', password: 'password1' }))
            .rejects.toThrow(common_1.BadRequestException);
        expect(mockRedis.cacheDelete).not.toHaveBeenCalled();
    });
    test('throws BadRequestException when employee fields missing for employee invite', async () => {
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(validInvite));
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.redeemInvite({ token: 'abc', password: 'password1' }))
            .rejects.toThrow(common_1.BadRequestException);
    });
    test('throws ConflictException when email already registered', async () => {
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(validInvite));
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id FROM users'))
                return Promise.resolve([{ id: USER }]);
            return Promise.resolve([]);
        });
        await expect(service.redeemInvite({
            token: 'abc', password: 'password1', full_name: 'A', employee_code: 'NV001',
        })).rejects.toThrow(common_1.ConflictException);
    });
});
describe('SetupService.getChecklist', () => {
    test('next_step=add_client when no clients exist', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id, name, tax_code'))
                return Promise.resolve([{ id: TENANT, name: 'Firm', tax_code: '123', created_at: new Date() }]);
            if (sql.includes('FROM clients c'))
                return Promise.resolve([]);
            if (sql.includes('COUNT(*) FROM employees'))
                return Promise.resolve([{ count: '0' }]);
            if (sql.includes('COUNT(*) FROM expenses'))
                return Promise.resolve([{ count: '0' }]);
            return Promise.resolve([]);
        });
        const result = await service.getChecklist(TENANT);
        expect(result.next_step).toBe('add_client');
        expect(result.steps_complete).toBe(1);
        expect(result.client_count).toBe(0);
    });
    test('next_step=add_employee when clients exist but no employees', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id, name, tax_code'))
                return Promise.resolve([{ id: TENANT, name: 'Firm', tax_code: '123', created_at: new Date() }]);
            if (sql.includes('FROM clients c'))
                return Promise.resolve([{ id: CLIENT, name: 'Cty A', employee_count: 0 }]);
            if (sql.includes('COUNT(*) FROM employees'))
                return Promise.resolve([{ count: '0' }]);
            if (sql.includes('COUNT(*) FROM expenses'))
                return Promise.resolve([{ count: '0' }]);
            return Promise.resolve([]);
        });
        const result = await service.getChecklist(TENANT);
        expect(result.next_step).toBe('add_employee');
        expect(result.steps_complete).toBe(2);
        expect(result.client_count).toBe(1);
    });
    test('next_step=upload_receipt when employees exist but no receipts', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id, name, tax_code'))
                return Promise.resolve([{ id: TENANT, name: 'Firm', tax_code: '123', created_at: new Date() }]);
            if (sql.includes('FROM clients c'))
                return Promise.resolve([{ id: CLIENT, name: 'Cty A', employee_count: 3 }]);
            if (sql.includes('COUNT(*) FROM employees'))
                return Promise.resolve([{ count: '3' }]);
            if (sql.includes('COUNT(*) FROM expenses'))
                return Promise.resolve([{ count: '0' }]);
            return Promise.resolve([]);
        });
        const result = await service.getChecklist(TENANT);
        expect(result.next_step).toBe('upload_receipt');
        expect(result.steps_complete).toBe(3);
    });
    test('next_step=done when all four steps are complete', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('SELECT id, name, tax_code'))
                return Promise.resolve([{ id: TENANT, name: 'Firm', tax_code: '123', created_at: new Date() }]);
            if (sql.includes('FROM clients c'))
                return Promise.resolve([{ id: CLIENT, name: 'Cty A', employee_count: 3 }]);
            if (sql.includes('COUNT(*) FROM employees'))
                return Promise.resolve([{ count: '5' }]);
            if (sql.includes('COUNT(*) FROM expenses'))
                return Promise.resolve([{ count: '2' }]);
            return Promise.resolve([]);
        });
        const result = await service.getChecklist(TENANT);
        expect(result.next_step).toBe('done');
        expect(result.steps_complete).toBe(4);
        expect(result.employee_count).toBe(5);
        expect(result.receipt_count).toBe(2);
        expect(result.clients).toHaveLength(1);
        expect(result.clients[0].name).toBe('Cty A');
    });
});
//# sourceMappingURL=setup.service.spec.js.map