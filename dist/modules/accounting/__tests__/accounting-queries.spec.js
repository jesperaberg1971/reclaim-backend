"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accounting_service_1 = require("../accounting.service");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const mockNotifications = {
    notifyExpenseDecision: jest.fn(),
    notifyReadyForReview: jest.fn(),
};
const mockRedis = {
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
function makeExpenseRow(overrides = {}) {
    return {
        id: EXPENSE,
        receipt_date: new Date('2026-05-15'),
        original_amount: '350000',
        final_amount_deductible: '350000',
        currency: 'VND',
        gate_applied: 2,
        final_category: 'welfare_allowance',
        pit_flag: false,
        erp_exported: false,
        status: 'approved',
        supporting_documents: [],
        ocr_raw_json: { vendor: 'Highlands', confidence: 0.9 },
        accountant_reviewed_at: null,
        reviewer_note: null,
        approval_decision: null,
        parent_expense_id: null,
        child_ids: null,
        bank_last_four: null,
        employee_name: 'Nguyen Van A',
        employee_internal_id: 'EMP-001',
        client_id: 'client-uuid-1',
        client_name: 'Cty ABC',
        split_child_count: 0,
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
    const mockSignedUrlService = { getSignedUrl: jest.fn().mockImplementation((u) => Promise.resolve(u)) };
    const service = new accounting_service_1.AccountingService(ds, mockNotifications, mockRedis, mockSignedUrlService);
    return { service, queryMock };
}
beforeEach(() => jest.clearAllMocks());
describe('AccountingService.getExpenseDetail', () => {
    test('throws when expense row not found', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.getExpenseDetail(EXPENSE, TENANT)).rejects.toThrow();
    });
    test('returns gate-2 detail with correct accounting codes', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM expenses e'))
                return Promise.resolve([makeExpenseRow()]);
            return Promise.resolve([]);
        });
        const detail = await service.getExpenseDetail(EXPENSE, TENANT);
        expect(detail.id).toBe(EXPENSE);
        expect(detail.gate_applied).toBe(2);
        expect(detail.accounting_debit).toBe('6422');
        expect(detail.accounting_credit).toBe('111');
        expect(detail.voucher).toBeNull();
        expect(detail.trip_decision).toBeNull();
    });
    test('has_voucher is true for gate-3 expenses', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM expenses e'))
                return Promise.resolve([makeExpenseRow({ gate_applied: 3 })]);
            return Promise.resolve([]);
        });
        const detail = await service.getExpenseDetail(EXPENSE, TENANT);
        expect(detail.has_voucher).toBe(true);
        expect(detail.accounting_credit).toBe('141');
        expect(detail.voucher).not.toBeNull();
        expect(detail.voucher.voucher_number).toMatch(/^PV-/);
    });
    test('populates child_ids from array returned by DB', async () => {
        const childIds = ['child-uuid-1', 'child-uuid-2'];
        const { service } = buildService((sql) => {
            if (sql.includes('FROM expenses e')) {
                return Promise.resolve([makeExpenseRow({ child_ids: childIds })]);
            }
            return Promise.resolve([]);
        });
        const detail = await service.getExpenseDetail(EXPENSE, TENANT);
        expect(detail.child_ids).toEqual(childIds);
    });
    test('gate-1 queries trip_decisions table', async () => {
        const tripRow = {
            start_date: new Date('2026-05-10'), end_date: new Date('2026-05-20'),
            destination: 'Hà Nội', daily_allowance_amount: '300000',
        };
        const { service, queryMock } = buildService((sql) => {
            if (sql.includes('FROM expenses e'))
                return Promise.resolve([makeExpenseRow({ gate_applied: 1 })]);
            if (sql.includes('trip_decisions'))
                return Promise.resolve([tripRow]);
            return Promise.resolve([]);
        });
        const detail = await service.getExpenseDetail(EXPENSE, TENANT);
        expect(detail.trip_decision).not.toBeNull();
        expect(detail.trip_decision.destination).toBe('Hà Nội');
        expect(detail.trip_decision.daily_allowance_vnd).toBe('300000');
        const tripCall = queryMock.mock.calls.find(([s]) => s.includes('trip_decisions'));
        expect(tripCall).toBeDefined();
    });
});
describe('AccountingService.listClients', () => {
    test('returns rows from clients query', async () => {
        const { service } = buildService(() => Promise.resolve([{ id: 'c-1', name: 'Cty ABC' }, { id: 'c-2', name: 'Cty XYZ' }]));
        const result = await service.listClients(TENANT);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Cty ABC');
    });
});
describe('AccountingService.listEmployees', () => {
    test('returns rows from employees query', async () => {
        const { service } = buildService(() => Promise.resolve([{ id: 'e-1', name: 'Nguyen Van A', employee_id: 'EMP-001' }]));
        const result = await service.listEmployees(TENANT);
        expect(result).toHaveLength(1);
        expect(result[0].employee_id).toBe('EMP-001');
    });
});
describe('AccountingService.getPeriodSummary', () => {
    const aggRow = {
        expense_count: '5', total_original: '1500000', total_deductible: '1200000',
        total_pit: '300000', pending_export_count: '2', exported_count: '3',
        gate1_ded: '700000', gate1_count: '3',
        gate2_ded: '500000', gate2_count: '2',
        gate3_ded: '0', gate3_count: '0',
    };
    test('maps aggregate row to PeriodSummary shape', async () => {
        const { service } = buildService(() => Promise.resolve([aggRow]));
        const result = await service.getPeriodSummary(TENANT, '2026-05-01', '2026-05-31');
        expect(result.expense_count).toBe(5);
        expect(result.total_deductible_vnd).toBe('1200000');
        expect(result.total_pit_vnd).toBe('300000');
        expect(result.pending_export_count).toBe(2);
        expect(result.exported_count).toBe(3);
        expect(result.by_gate.gate_1.count).toBe(3);
        expect(result.by_gate.gate_1.deductible_vnd).toBe('700000');
        expect(result.by_gate.gate_3.count).toBe(0);
    });
});
describe('AccountingService.getDashboardMetrics', () => {
    test('maps pending count and client summary', async () => {
        let callIdx = 0;
        const { service } = buildService((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            callIdx++;
            if (callIdx === 1) {
                return Promise.resolve([{ total_pending: '3' }]);
            }
            return Promise.resolve([{
                    client_id: 'c-1', client_name: 'Cty ABC',
                    pending: '3', approved: '5', rejected: '1', exported: '2',
                }]);
        });
        const result = await service.getDashboardMetrics(TENANT, '2026-05-01', '2026-05-31');
        expect(result.pending_approval).toBe(3);
        expect(result.total_clients_active).toBe(1);
        expect(result.approved_ready_to_export).toBe(5);
        expect(result.rejected_this_period).toBe(1);
        expect(result.client_summary[0].client_name).toBe('Cty ABC');
    });
    test('zero metrics when no expenses', async () => {
        let callIdx = 0;
        const { service } = buildService((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            callIdx++;
            if (callIdx === 1)
                return Promise.resolve([{ total_pending: '0' }]);
            return Promise.resolve([]);
        });
        const result = await service.getDashboardMetrics(TENANT, '2026-05-01', '2026-05-31');
        expect(result.pending_approval).toBe(0);
        expect(result.total_clients_active).toBe(0);
        expect(result.client_summary).toEqual([]);
    });
});
describe('AccountingService.getRecentExports', () => {
    test('maps audit rows to RecentExport shape', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([
            { action: 'erp_export', metadata: { count: 5 }, created_at: new Date('2026-06-01') },
            { action: 'misa_csv_export', metadata: null, created_at: new Date('2026-06-02') },
        ]);
        const result = await service.getRecentExports(TENANT);
        expect(result).toHaveLength(2);
        expect(result[0].action).toBe('erp_export');
        expect(result[0].created_at).toMatch(/^2026-06-01/);
        expect(result[1].metadata).toBeNull();
    });
    test('returns empty array when no export history', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        expect(await service.getRecentExports(TENANT)).toEqual([]);
    });
});
//# sourceMappingURL=accounting-queries.spec.js.map