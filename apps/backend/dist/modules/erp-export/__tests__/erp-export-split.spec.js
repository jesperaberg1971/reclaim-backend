"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const erp_export_service_1 = require("../erp-export.service");
let _seq = 0;
function uid() { return `uuid-${++_seq}`; }
function makeRow(overrides = {}) {
    return {
        id: uid(),
        parent_expense_id: null,
        child_ids: null,
        receipt_date: new Date('2026-01-15'),
        original_amount: '500000',
        final_amount_deductible: '300000',
        currency: 'VND',
        gate_applied: 1,
        final_category: 'travel_allowance',
        pit_flag: false,
        erp_exported: false,
        ocr_raw_json: { vendor: 'Grab', confidence: 0.95 },
        supporting_documents: [],
        employee_uuid: 'emp-1',
        employee_name: 'Nguyễn Văn A',
        employee_internal_id: 'EMP-001',
        client_uuid: 'client-1',
        client_name: 'Công ty ABC',
        bank_last_four: null,
        ...overrides,
    };
}
function buildService(mainRows, splitDbRows = []) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (sql.includes('FROM partners'))
            return Promise.resolve([{ name: 'Test Partner' }]);
        if (sql.includes('FROM clients'))
            return Promise.resolve([{ name: 'Test Client' }]);
        if (sql.includes('receipt_date >='))
            return Promise.resolve(mainRows);
        if (sql.includes('parent_expense_id = ANY'))
            return Promise.resolve(splitDbRows);
        if (sql.includes('erp_exported = TRUE'))
            return Promise.resolve([]);
        return Promise.resolve([]);
    });
    const mockDataSource = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
    };
    const mockBatchQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const mockWebhook = { fireEvent: jest.fn().mockResolvedValue(undefined) };
    const mockRedis = { cacheGet: jest.fn().mockResolvedValue(null), cacheSet: jest.fn().mockResolvedValue(undefined) };
    return {
        service: new erp_export_service_1.ErpExportService({}, mockDataSource, mockBatchQueue, mockWebhook, mockRedis),
        queryMock,
    };
}
const TENANT = 'tenant-uuid-1';
const BASE_DTO = { from: '2026-01-01', to: '2026-01-31', mark_exported: false };
describe('ErpExportService — split group calculation', () => {
    beforeEach(() => { _seq = 0; });
    test('no parents in export: split_groups is empty', async () => {
        const { service } = buildService([makeRow()]);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        expect(pkg.summary.split_groups).toHaveLength(0);
    });
    test('no parents: split totals DB query is never executed', async () => {
        const { service, queryMock } = buildService([makeRow()]);
        await service.generateStructuredExport(TENANT, BASE_DTO);
        const splitCalls = queryMock.mock.calls.filter(([sql]) => sql.includes('parent_expense_id = ANY'));
        expect(splitCalls).toHaveLength(0);
    });
    test('parent + child both in range: total_split equals DB-returned sum', async () => {
        const parentId = uid(), childId = uid();
        const rows = [
            makeRow({ id: parentId, child_ids: [childId] }),
            makeRow({ id: childId, parent_expense_id: parentId, final_amount_deductible: '200000' }),
        ];
        const { service } = buildService(rows, [
            { parent_expense_id: parentId, total_split: '200000' },
        ]);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        expect(pkg.summary.split_groups).toHaveLength(1);
        expect(pkg.summary.split_groups[0]).toMatchObject({
            parent_id: parentId,
            child_ids: [childId],
            total_split: '200000',
        });
    });
    test('child outside export window: total_split still reflects DB total', async () => {
        const parentId = uid(), childId = uid();
        const { service } = buildService([makeRow({ id: parentId, child_ids: [childId] })], [{ parent_expense_id: parentId, total_split: '200000' }]);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        expect(pkg.summary.split_groups[0].total_split).toBe('200000');
        expect(pkg.expenses.find(e => e.id === childId)).toBeUndefined();
    });
    test('old in-memory approach would have returned "0" for an out-of-range child', () => {
        const parentId = uid();
        const inRangeRecords = [makeRow({ id: parentId, child_ids: [uid()] })];
        const oldTotal = inRangeRecords
            .filter(r => r.parent_expense_id === parentId)
            .reduce((sum, r) => String(Number(sum) + Number(r.final_amount_deductible)), '0');
        expect(oldTotal).toBe('0');
    });
    test('two parents: each receives its own DB-sourced total independently', async () => {
        const p1 = uid(), c1 = uid();
        const p2 = uid(), c2a = uid(), c2b = uid();
        const { service } = buildService([
            makeRow({ id: p1, child_ids: [c1] }),
            makeRow({ id: p2, child_ids: [c2a, c2b] }),
        ], [
            { parent_expense_id: p1, total_split: '150000' },
            { parent_expense_id: p2, total_split: '400000' },
        ]);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        const g1 = pkg.summary.split_groups.find(g => g.parent_id === p1);
        const g2 = pkg.summary.split_groups.find(g => g.parent_id === p2);
        expect(g1?.total_split).toBe('150000');
        expect(g2?.total_split).toBe('400000');
        expect(g2?.child_ids).toEqual([c2a, c2b]);
    });
    test('two parents: both IDs passed to the DB query in a single call', async () => {
        const p1 = uid(), p2 = uid();
        const { service, queryMock } = buildService([makeRow({ id: p1, child_ids: [uid()] }), makeRow({ id: p2, child_ids: [uid()] })], []);
        await service.generateStructuredExport(TENANT, BASE_DTO);
        const splitCalls = queryMock.mock.calls.filter(([sql]) => sql.includes('parent_expense_id = ANY'));
        expect(splitCalls).toHaveLength(1);
        const passedIds = splitCalls[0][1][0];
        expect(passedIds).toContain(p1);
        expect(passedIds).toContain(p2);
    });
    test('parent with no approved DB children: total_split defaults to "0"', async () => {
        const parentId = uid();
        const { service } = buildService([makeRow({ id: parentId, child_ids: [uid()] })], []);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        expect(pkg.summary.split_groups[0].total_split).toBe('0');
    });
    test('split group shape: parent_id, child_ids, total_split fields are all present', async () => {
        const parentId = uid(), childId = uid();
        const { service } = buildService([makeRow({ id: parentId, child_ids: [childId] })], [{ parent_expense_id: parentId, total_split: '250000' }]);
        const pkg = await service.generateStructuredExport(TENANT, BASE_DTO);
        const group = pkg.summary.split_groups[0];
        expect(group).toHaveProperty('parent_id');
        expect(group).toHaveProperty('child_ids');
        expect(group).toHaveProperty('total_split');
    });
});
//# sourceMappingURL=erp-export-split.spec.js.map