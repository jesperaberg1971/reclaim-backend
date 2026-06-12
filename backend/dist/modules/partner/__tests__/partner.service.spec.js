"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const partner_service_1 = require("../partner.service");
const PARTNER_ID = 'partner-uuid-1';
const CLIENT_ID = 'client-uuid-1';
const EMPLOYEE_ID = 'employee-uuid-1';
function buildService(queryImpl) {
    const queryMock = jest.fn().mockImplementation((sql, params) => queryImpl(sql, params));
    const ds = { query: queryMock };
    return { service: new partner_service_1.PartnerService(ds), queryMock };
}
beforeEach(() => jest.clearAllMocks());
describe('PartnerService.getDashboard', () => {
    test('returns aggregated dashboard stats', async () => {
        let call = 0;
        const { service } = buildService(() => {
            if (call === 0) {
                call++;
                return Promise.resolve([{ total: 5 }]);
            }
            if (call === 1) {
                call++;
                return Promise.resolve([{ total: 20 }]);
            }
            return Promise.resolve([{ total: 50, pending: 5, approved: 40, total_amount_vnd: '5000000', this_month: 12 }]);
        });
        const d = await service.getDashboard(PARTNER_ID);
        expect(d.totalClients).toBe(5);
        expect(d.totalEmployees).toBe(20);
        expect(d.pendingExpenses).toBe(5);
        expect(d.approvedExpenses).toBe(40);
        expect(d.expensesThisMonth).toBe(12);
    });
});
describe('PartnerService.listClients', () => {
    test('returns clients with stats', async () => {
        const row = { id: CLIENT_ID, name: 'ABC Corp', is_active: true, created_at: new Date(), employee_count: 3, expense_count: 10, pending_count: 2 };
        const { service } = buildService(() => Promise.resolve([row]));
        const result = await service.listClients(PARTNER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(CLIENT_ID);
        expect(result[0].employee_count).toBe(3);
    });
    test('returns empty array when no clients', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.listClients(PARTNER_ID);
        expect(result).toEqual([]);
    });
});
describe('PartnerService.createClient', () => {
    test('throws ConflictException if client name already exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients WHERE partner_id'))
                return Promise.resolve([{ id: CLIENT_ID }]);
            return Promise.resolve([]);
        });
        await expect(service.createClient(PARTNER_ID, { name: 'Duplicate' })).rejects.toThrow(common_1.ConflictException);
    });
    test('inserts and returns new client', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients WHERE partner_id'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO clients'))
                return Promise.resolve([{
                        id: CLIENT_ID, name: 'New Client', is_active: true, created_at: new Date(),
                    }]);
            return Promise.resolve([]);
        });
        const result = await service.createClient(PARTNER_ID, { name: 'New Client' });
        expect(result.id).toBe(CLIENT_ID);
        expect(result.name).toBe('New Client');
        expect(result.employee_count).toBe(0);
    });
});
describe('PartnerService.updateClient', () => {
    test('throws NotFoundException when client not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE clients'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.updateClient(CLIENT_ID, PARTNER_ID, { is_active: false })).rejects.toThrow(common_1.NotFoundException);
    });
    test('updates and returns client', async () => {
        const row = { id: CLIENT_ID, name: 'Updated', is_active: false, created_at: new Date(), employee_count: 0, expense_count: 0, pending_count: 0 };
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE clients'))
                return Promise.resolve([{ id: CLIENT_ID }]);
            return Promise.resolve([row]);
        });
        const result = await service.updateClient(CLIENT_ID, PARTNER_ID, { is_active: false });
        expect(result.id).toBe(CLIENT_ID);
        expect(result.is_active).toBe(false);
    });
});
describe('PartnerService.listEmployees', () => {
    const empRow = { id: EMPLOYEE_ID, employee_id: 'NV001', full_name: 'John', is_active: true, pdpd_consent: false, client_id: CLIENT_ID, client_name: 'ABC' };
    test('returns all employees for partner', async () => {
        const { service } = buildService(() => Promise.resolve([empRow]));
        const result = await service.listEmployees(PARTNER_ID);
        expect(result).toHaveLength(1);
        expect(result[0].employee_id).toBe('NV001');
    });
    test('filters by clientId when provided', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([empRow]));
        await service.listEmployees(PARTNER_ID, CLIENT_ID);
        const sql = queryMock.mock.calls[0][0];
        expect(sql).toContain('e.client_id');
        expect(queryMock.mock.calls[0][1]).toContain(CLIENT_ID);
    });
    test('returns empty array when no employees', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        expect(await service.listEmployees(PARTNER_ID)).toEqual([]);
    });
});
describe('PartnerService.createEmployee', () => {
    test('throws NotFoundException when client does not belong to partner', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients WHERE id'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.createEmployee(PARTNER_ID, { full_name: 'Jane', employee_id: 'NV002', client_id: CLIENT_ID })).rejects.toThrow(common_1.NotFoundException);
    });
    test('throws ConflictException if employee_id already exists', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients WHERE id'))
                return Promise.resolve([{ id: CLIENT_ID }]);
            if (sql.includes('FROM employees WHERE client_id'))
                return Promise.resolve([{ id: EMPLOYEE_ID }]);
            return Promise.resolve([]);
        });
        await expect(service.createEmployee(PARTNER_ID, { full_name: 'Jane', employee_id: 'NV001', client_id: CLIENT_ID })).rejects.toThrow(common_1.ConflictException);
    });
    test('inserts and returns new employee', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM clients WHERE id'))
                return Promise.resolve([{ id: CLIENT_ID }]);
            if (sql.includes('FROM employees WHERE client_id'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO employees'))
                return Promise.resolve([{
                        id: EMPLOYEE_ID, employee_id: 'NV002', full_name: 'Jane', is_active: true, pdpd_consent: false,
                    }]);
            return Promise.resolve([]);
        });
        const result = await service.createEmployee(PARTNER_ID, { full_name: 'Jane', employee_id: 'NV002', client_id: CLIENT_ID });
        expect(result.employee_id).toBe('NV002');
        expect(result.full_name).toBe('Jane');
    });
});
describe('PartnerService.updateEmployee', () => {
    test('throws ConflictException when no fields to update', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.updateEmployee(EMPLOYEE_ID, PARTNER_ID, {})).rejects.toThrow(common_1.ConflictException);
    });
    test('throws NotFoundException when employee not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE employees'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.updateEmployee(EMPLOYEE_ID, PARTNER_ID, { is_active: false })).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns updated employee', async () => {
        const updated = { id: EMPLOYEE_ID, employee_id: 'NV001', full_name: 'Updated', is_active: false, pdpd_consent: false, client_id: CLIENT_ID };
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE employees'))
                return Promise.resolve([updated]);
            return Promise.resolve([]);
        });
        const result = await service.updateEmployee(EMPLOYEE_ID, PARTNER_ID, { is_active: false });
        expect(result.is_active).toBe(false);
    });
});
describe('PartnerService.getReports', () => {
    test('returns report items per client', async () => {
        const row = { client_id: CLIENT_ID, client_name: 'ABC', total: 15, pending: 3, approved: 10, rejected: 2, approved_amount_vnd: '1500000' };
        const { service } = buildService(() => Promise.resolve([row]));
        const result = await service.getReports(PARTNER_ID, {});
        expect(result.items).toHaveLength(1);
        expect(result.items[0].total).toBe(15);
        expect(result.from).toBeDefined();
        expect(result.to).toBeDefined();
    });
    test('passes date filters correctly', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([]));
        await service.getReports(PARTNER_ID, { from: '2026-01-01', to: '2026-06-01' });
        const params = queryMock.mock.calls[0][1];
        expect(params).toContain('2026-01-01');
        expect(params).toContain('2026-06-01');
    });
});
//# sourceMappingURL=partner.service.spec.js.map