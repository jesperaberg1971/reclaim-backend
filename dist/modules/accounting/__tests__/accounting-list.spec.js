"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accounting_service_1 = require("../accounting.service");
function makeRow(overrides = {}) {
    return {
        id: 'exp-' + Math.random().toString(36).slice(2, 10),
        receipt_date: new Date('2026-05-15'),
        original_amount: '500000.0000',
        final_amount_deductible: '500000.0000',
        currency: 'VND',
        gate_applied: 1,
        final_category: 'travel_allowance',
        pit_flag: false,
        erp_exported: false,
        status: 'approved',
        supporting_documents: [],
        ocr_raw_json: { vendor: 'Grab' },
        accountant_reviewed_at: null,
        reviewer_note: null,
        approval_decision: null,
        parent_expense_id: null,
        split_child_count: 0,
        employee_name: 'Nguyễn Văn A',
        employee_internal_id: 'EMP-001',
        client_id: 'client-uuid-1',
        client_name: 'Công ty ABC',
        ...overrides,
    };
}
function makeRows(n) {
    return Array.from({ length: n }, (_, i) => makeRow({ id: `exp-${i + 1}` }));
}
const mockNotificationsService = {
    notifyExpenseDecision: jest.fn().mockResolvedValue(undefined),
};
function buildService(countValue, dataRows) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (sql.includes('COUNT(*) AS count'))
            return Promise.resolve([{ count: String(countValue) }]);
        return Promise.resolve(dataRows);
    });
    const mockDataSource = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
    };
    const mockRedis = { cacheGet: jest.fn().mockResolvedValue(null), cacheSet: jest.fn(), cacheDelete: jest.fn() };
    const mockSignedUrlService = { getSignedUrl: jest.fn().mockImplementation((u) => Promise.resolve(u)) };
    const service = new accounting_service_1.AccountingService(mockDataSource, mockNotificationsService, mockRedis, mockSignedUrlService, null);
    return { service, queryMock };
}
function findCall(queryMock, predicate) {
    const call = queryMock.mock.calls.find(([sql]) => predicate(sql));
    if (!call)
        throw new Error('No matching query call found');
    return { sql: call[0], params: (call[1] ?? []) };
}
const TENANT = 'tenant-uuid-1';
describe('listExpenses — pagination (120 mock expenses)', () => {
    test('page 1: returns 50 rows, correct metadata', async () => {
        const { service } = buildService(120, makeRows(50));
        const result = await service.listExpenses(TENANT, { page: 1, limit: 50 });
        expect(result.data).toHaveLength(50);
        expect(result.total).toBe(120);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(50);
        expect(result.totalPages).toBe(3);
    });
    test('page 2: OFFSET = 50', async () => {
        const { service, queryMock } = buildService(120, makeRows(50));
        await service.listExpenses(TENANT, { page: 2, limit: 50 });
        const { params } = findCall(queryMock, (s) => s.includes('LIMIT'));
        const [limit, offset] = params.slice(-2);
        expect(limit).toBe(50);
        expect(offset).toBe(50);
    });
    test('page 3: OFFSET = 100, totalPages still 3', async () => {
        const { service, queryMock } = buildService(120, makeRows(20));
        const result = await service.listExpenses(TENANT, { page: 3, limit: 50 });
        expect(result.page).toBe(3);
        expect(result.totalPages).toBe(3);
        const { params } = findCall(queryMock, (s) => s.includes('LIMIT'));
        const [, offset] = params.slice(-2);
        expect(offset).toBe(100);
    });
    test('default page = 1, default limit = 50', async () => {
        const { service, queryMock } = buildService(120, makeRows(50));
        await service.listExpenses(TENANT, {});
        const { params } = findCall(queryMock, (s) => s.includes('LIMIT'));
        const [limit, offset] = params.slice(-2);
        expect(limit).toBe(50);
        expect(offset).toBe(0);
    });
    test('limit clamped to 200 maximum', async () => {
        const { service, queryMock } = buildService(120, makeRows(120));
        await service.listExpenses(TENANT, { limit: 999 });
        const { params } = findCall(queryMock, (s) => s.includes('LIMIT'));
        const [limit] = params.slice(-2);
        expect(limit).toBe(200);
    });
    test('page < 1 treated as page 1 (OFFSET = 0)', async () => {
        const { service, queryMock } = buildService(120, makeRows(50));
        await service.listExpenses(TENANT, { page: -5 });
        const { params } = findCall(queryMock, (s) => s.includes('LIMIT'));
        const [, offset] = params.slice(-2);
        expect(offset).toBe(0);
    });
    test('totalPages = ceil(total / limit)', async () => {
        const { service } = buildService(101, makeRows(50));
        const result = await service.listExpenses(TENANT, { limit: 50 });
        expect(result.totalPages).toBe(3);
    });
    test('COUNT query is always executed (avoids full scan for metadata)', async () => {
        const { service, queryMock } = buildService(120, makeRows(50));
        await service.listExpenses(TENANT, { page: 1 });
        const countCalls = queryMock.mock.calls.filter(([s]) => s.includes('COUNT(*) AS count'));
        expect(countCalls).toHaveLength(1);
    });
});
describe('listExpenses — filters', () => {
    test('from: adds receipt_date >= condition with correct param', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { from: '2026-01-01' });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('receipt_date::date >= $1');
        expect(params[0]).toBe('2026-01-01');
    });
    test('to: adds receipt_date <= condition with correct param', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { to: '2026-05-31' });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('receipt_date::date <= $1');
        expect(params[0]).toBe('2026-05-31');
    });
    test('from + to: both conditions present, params in order', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { from: '2026-01-01', to: '2026-05-31' });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('receipt_date::date >= $1');
        expect(sql).toContain('receipt_date::date <= $2');
        expect(params).toEqual(['2026-01-01', '2026-05-31']);
    });
    test('clientId: adds e.client_id = $N with correct UUID', async () => {
        const clientId = 'client-uuid-abc';
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { clientId });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.client_id = $1');
        expect(params[0]).toBe(clientId);
    });
    test('employeeId: adds e.employee_id = $N with correct UUID', async () => {
        const employeeId = 'emp-uuid-xyz';
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { employeeId });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.employee_id = $1');
        expect(params[0]).toBe(employeeId);
    });
    test('gate: adds gate_applied = $N', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { gate: 2 });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.gate_applied = $1');
        expect(params[0]).toBe(2);
    });
    test('status=pending_export: adds erp_exported = false (no param needed)', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { status: 'pending_export' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.erp_exported = false');
    });
    test('status=exported: adds erp_exported = true', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { status: 'exported' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.erp_exported = true');
    });
    test('search: adds LIKE condition with lowercased value', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { search: 'Grab' });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('LIKE $1');
        expect(params[0]).toBe('%grab%');
    });
    test('search: matches both employee full_name and vendor', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { search: 'nguyen' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('emp.full_name');
        expect(sql).toContain("ocr_raw_json->>'vendor'");
    });
    test('clientId + employeeId + gate combined: all three conditions present', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, {
            clientId: 'c-1',
            employeeId: 'e-1',
            gate: 3,
        });
        const { sql, params } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.client_id = $1');
        expect(sql).toContain('e.employee_id = $2');
        expect(sql).toContain('e.gate_applied = $3');
        expect(params).toEqual(['c-1', 'e-1', 3]);
    });
    test('no filters: only base status condition', async () => {
        const { service, queryMock } = buildService(0, []);
        await service.listExpenses(TENANT, {});
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain("status IN ('approved','erp_exported','rejected','needs_review')");
        const andCount = (sql.match(/AND/gi) ?? []).length;
        expect(andCount).toBe(0);
    });
    test('approvalDecision=pending: adds IS NULL condition', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { approvalDecision: 'pending' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain('e.approval_decision IS NULL');
    });
    test('approvalDecision=approved: adds = approved condition', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { approvalDecision: 'approved' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain("e.approval_decision = 'approved'");
    });
    test('approvalDecision=rejected: adds = rejected condition', async () => {
        const { service, queryMock } = buildService(5, makeRows(5));
        await service.listExpenses(TENANT, { approvalDecision: 'rejected' });
        const { sql } = findCall(queryMock, (s) => s.includes('COUNT(*)'));
        expect(sql).toContain("e.approval_decision = 'rejected'");
    });
});
describe('listExpenses — edge cases', () => {
    test('empty result: total=0, data=[], totalPages=0', async () => {
        const { service } = buildService(0, []);
        const result = await service.listExpenses(TENANT, {});
        expect(result.data).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
    });
    test('exactly one full page (50 records): totalPages=1', async () => {
        const { service } = buildService(50, makeRows(50));
        const result = await service.listExpenses(TENANT, { limit: 50 });
        expect(result.totalPages).toBe(1);
    });
    test('51 records with limit=50: totalPages=2', async () => {
        const { service } = buildService(51, makeRows(50));
        const result = await service.listExpenses(TENANT, { limit: 50 });
        expect(result.totalPages).toBe(2);
    });
    test('response shape has all required fields', async () => {
        const { service } = buildService(10, makeRows(10));
        const result = await service.listExpenses(TENANT, {});
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('page');
        expect(result).toHaveProperty('limit');
        expect(result).toHaveProperty('totalPages');
    });
    test('each expense row has accountant_reviewed_at field (nullable)', async () => {
        const { service } = buildService(1, [makeRow({ accountant_reviewed_at: null })]);
        const result = await service.listExpenses(TENANT, {});
        expect(result.data[0]).toHaveProperty('accountant_reviewed_at', null);
        expect(result.data[0]).toHaveProperty('approval_decision', null);
    });
});
//# sourceMappingURL=accounting-list.spec.js.map