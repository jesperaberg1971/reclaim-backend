"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accounting_service_1 = require("../accounting.service");
const TENANT = 'tenant-uuid-1';
const FROM = '2026-01-01';
const TO = '2026-06-30';
const mockNotifications = {
    notifyExpenseDecision: jest.fn(),
    notifyReadyForReview: jest.fn(),
};
const mockRedis = {
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
function buildService(impl) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        return impl(sql);
    });
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
        query: queryMock,
    };
    return new accounting_service_1.AccountingService(ds, mockNotifications, mockRedis);
}
beforeEach(() => jest.clearAllMocks());
describe('AccountingService.getSpendingBreakdown', () => {
    const categoryRows = [
        { group_key: 'travel_allowance', expense_count: '5', total_original: '500000', total_deductible: '500000', total_pit: '0' },
        { group_key: 'welfare_allowance', expense_count: '3', total_original: '300000', total_deductible: '250000', total_pit: '50000' },
    ];
    test('category groupBy returns correct shape and labels', async () => {
        const service = buildService(() => Promise.resolve(categoryRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'category');
        expect(result.group_by).toBe('category');
        expect(result.rows).toHaveLength(2);
        const travelRow = result.rows[0];
        expect(travelRow.group_key).toBe('travel_allowance');
        expect(travelRow.group_label).toBe('Công tác phí (Gate 1)');
        expect(travelRow.expense_count).toBe(5);
        expect(travelRow.total_original_vnd).toBe('500000');
        expect(travelRow.percentage_of_total).toBeCloseTo(62.5, 1);
        const welfareRow = result.rows[1];
        expect(welfareRow.group_label).toBe('Phúc lợi nhân viên (Gate 2)');
        expect(welfareRow.total_pit_vnd).toBe('50000');
    });
    test('totals aggregate all rows', async () => {
        const service = buildService(() => Promise.resolve(categoryRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'category');
        expect(result.totals.expense_count).toBe(8);
        expect(result.totals.total_original_vnd).toBe('800000');
        expect(result.totals.total_deductible_vnd).toBe('750000');
    });
    test('employee groupBy sets label from full_name + employee_code', async () => {
        const empRows = [
            { group_key: 'emp-uuid-1', group_name: 'Nguyen Van A', employee_code: 'EMP-001',
                expense_count: '2', total_original: '200000', total_deductible: '200000', total_pit: '0' },
        ];
        const service = buildService(() => Promise.resolve(empRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'employee');
        expect(result.rows[0].group_label).toBe('Nguyen Van A (EMP-001)');
    });
    test('gate groupBy labels gates with Vietnamese names', async () => {
        const gateRows = [
            { group_key: '1', expense_count: '4', total_original: '400000', total_deductible: '400000', total_pit: '0' },
            { group_key: '2', expense_count: '2', total_original: '200000', total_deductible: '180000', total_pit: '20000' },
        ];
        const service = buildService(() => Promise.resolve(gateRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'gate');
        expect(result.rows[0].group_label).toMatch(/Gate 1/);
        expect(result.rows[1].group_label).toMatch(/Gate 2/);
    });
    test('period groupBy uses YYYY-MM as key and label', async () => {
        const periodRows = [
            { group_key: '2026-01', expense_count: '3', total_original: '300000', total_deductible: '300000', total_pit: '0' },
            { group_key: '2026-02', expense_count: '2', total_original: '200000', total_deductible: '200000', total_pit: '0' },
        ];
        const service = buildService(() => Promise.resolve(periodRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'period');
        expect(result.rows[0].group_key).toBe('2026-01');
        expect(result.rows[0].group_label).toBe('2026-01');
    });
    test('percentage_of_total is 0 when grand total is zero', async () => {
        const zeroRows = [
            { group_key: 'travel_allowance', expense_count: '0', total_original: '0', total_deductible: '0', total_pit: '0' },
        ];
        const service = buildService(() => Promise.resolve(zeroRows));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'category');
        expect(result.rows[0].percentage_of_total).toBe(0);
    });
    test('returns cached value if Redis has entry', async () => {
        const cachedData = {
            group_by: 'category', from: FROM, to: TO,
            rows: [], totals: { expense_count: 0, total_original_vnd: '0', total_deductible_vnd: '0' },
        };
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(cachedData));
        const service = buildService(() => Promise.resolve([]));
        const result = await service.getSpendingBreakdown(TENANT, FROM, TO, 'category');
        expect(result).toEqual(cachedData);
    });
});
describe('AccountingService.getGatePerformance', () => {
    const perfRows = [
        {
            gate_applied: 1, expense_count: '10', approved_count: '8', rejected_count: '1',
            pending_count: '1', escalated_steps: '2', total_steps: '10',
            avg_processing_hours: '24.5',
        },
        {
            gate_applied: 2, expense_count: '6', approved_count: '5', rejected_count: '1',
            pending_count: '0', escalated_steps: '0', total_steps: '6',
            avg_processing_hours: '12.0',
        },
    ];
    test('returns correct per-gate metrics', async () => {
        const service = buildService(() => Promise.resolve(perfRows));
        const result = await service.getGatePerformance(TENANT, FROM, TO);
        expect(result.gates).toHaveLength(2);
        const g1 = result.gates[0];
        expect(g1.gate).toBe(1);
        expect(g1.expense_count).toBe(10);
        expect(g1.approved_count).toBe(8);
        expect(g1.approval_rate).toBeCloseTo(8 / 9, 3);
        expect(g1.escalation_rate).toBeCloseTo(2 / 10, 3);
        expect(g1.avg_processing_hours).toBe(24.5);
    });
    test('overall totals aggregate across gates', async () => {
        const service = buildService(() => Promise.resolve(perfRows));
        const result = await service.getGatePerformance(TENANT, FROM, TO);
        expect(result.overall.total_expenses).toBe(16);
        expect(result.overall.overall_approval_rate).toBeCloseTo(13 / 15, 3);
        expect(result.overall.overall_avg_processing_hours).toBeGreaterThan(0);
    });
    test('overall_avg_processing_hours is null when no expenses have reviewed_at', async () => {
        const noHoursRows = [{
                gate_applied: 1, expense_count: '3', approved_count: '0', rejected_count: '0',
                pending_count: '3', escalated_steps: '0', total_steps: '3',
                avg_processing_hours: null,
            }];
        const service = buildService(() => Promise.resolve(noHoursRows));
        const result = await service.getGatePerformance(TENANT, FROM, TO);
        expect(result.overall.overall_avg_processing_hours).toBeNull();
    });
    test('approval_rate is 0 when no decided expenses', async () => {
        const pendingOnly = [{
                gate_applied: 1, expense_count: '5', approved_count: '0', rejected_count: '0',
                pending_count: '5', escalated_steps: '0', total_steps: '5',
                avg_processing_hours: null,
            }];
        const service = buildService(() => Promise.resolve(pendingOnly));
        const result = await service.getGatePerformance(TENANT, FROM, TO);
        expect(result.gates[0].approval_rate).toBe(0);
        expect(result.gates[0].rejection_rate).toBe(0);
    });
    test('returns empty gates and zero overall for no expenses', async () => {
        const service = buildService(() => Promise.resolve([]));
        const result = await service.getGatePerformance(TENANT, FROM, TO);
        expect(result.gates).toHaveLength(0);
        expect(result.overall.total_expenses).toBe(0);
        expect(result.overall.overall_approval_rate).toBe(0);
        expect(result.overall.overall_avg_processing_hours).toBeNull();
    });
});
describe('AccountingService.getClientInsights', () => {
    const clientRows = [
        {
            client_id: 'client-1', client_name: 'Cty ABC', employee_count: '10',
            expense_count: '20', total_original: '2000000', total_deductible: '1800000',
            approved_count: '15', rejected_count: '3', pending_count: '2',
            erp_exported_count: '12', erp_pending_count: '3',
            avg_processing_hours: '18.0', top_category: 'travel_allowance',
        },
        {
            client_id: 'client-2', client_name: 'Cty XYZ', employee_count: '5',
            expense_count: '8', total_original: '800000', total_deductible: '750000',
            approved_count: '7', rejected_count: '1', pending_count: '0',
            erp_exported_count: '6', erp_pending_count: '1',
            avg_processing_hours: null, top_category: null,
        },
    ];
    test('maps client rows to ClientInsight shape', async () => {
        const service = buildService(() => Promise.resolve(clientRows));
        const result = await service.getClientInsights(TENANT, FROM, TO);
        expect(result.clients).toHaveLength(2);
        const c1 = result.clients[0];
        expect(c1.client_id).toBe('client-1');
        expect(c1.employee_count).toBe(10);
        expect(c1.expense_count).toBe(20);
        expect(c1.total_original_vnd).toBe('2000000');
        expect(c1.approval_rate).toBeCloseTo(15 / 18, 3);
        expect(c1.avg_processing_hours).toBe(18.0);
        expect(c1.top_category).toBe('Công tác phí (Gate 1)');
        const c2 = result.clients[1];
        expect(c2.avg_processing_hours).toBeNull();
        expect(c2.top_category).toBeNull();
    });
    test('portfolio_totals aggregate across all clients', async () => {
        const service = buildService(() => Promise.resolve(clientRows));
        const result = await service.getClientInsights(TENANT, FROM, TO);
        expect(result.portfolio_totals.total_clients).toBe(2);
        expect(result.portfolio_totals.total_expenses).toBe(28);
        expect(result.portfolio_totals.total_original_vnd).toBe('2800000');
        expect(result.portfolio_totals.overall_approval_rate).toBeCloseTo(22 / 26, 3);
    });
    test('overall_approval_rate is 0 with no decided expenses', async () => {
        const noDecided = [{ ...clientRows[0], approved_count: '0', rejected_count: '0' }];
        const service = buildService(() => Promise.resolve(noDecided));
        const result = await service.getClientInsights(TENANT, FROM, TO);
        expect(result.portfolio_totals.overall_approval_rate).toBe(0);
    });
    test('returns cached value if Redis has entry', async () => {
        const cachedData = {
            from: FROM, to: TO, clients: [],
            portfolio_totals: { total_clients: 0, total_expenses: 0, total_original_vnd: '0', total_deductible_vnd: '0', overall_approval_rate: 0 },
        };
        mockRedis.cacheGet.mockResolvedValueOnce(JSON.stringify(cachedData));
        const service = buildService(() => Promise.resolve([]));
        const result = await service.getClientInsights(TENANT, FROM, TO);
        expect(result).toEqual(cachedData);
    });
});
describe('AccountingService.exportAnalyticsCsv', () => {
    const categoryRows = [
        { group_key: 'travel_allowance', expense_count: '5', total_original: '500000', total_deductible: '500000', total_pit: '0' },
    ];
    const perfRows = [{
            gate_applied: 1, expense_count: '5', approved_count: '4', rejected_count: '1',
            pending_count: '0', escalated_steps: '1', total_steps: '5',
            avg_processing_hours: '10.0',
        }];
    const clientRows = [{
            client_id: 'c-1', client_name: 'Test, Inc', employee_count: '5',
            expense_count: '5', total_original: '500000', total_deductible: '450000',
            approved_count: '4', rejected_count: '1', pending_count: '0',
            erp_exported_count: '3', erp_pending_count: '1',
            avg_processing_hours: '8.0', top_category: 'welfare_allowance',
        }];
    test('spending CSV starts with BOM and has correct header', async () => {
        const service = buildService(() => Promise.resolve(categoryRows));
        const { buffer, filename } = await service.exportAnalyticsCsv(TENANT, FROM, TO, 'spending', 'category');
        const csv = buffer.toString('utf-8');
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
        expect(csv).toContain('Group Key');
        expect(csv).toContain('travel_allowance');
        expect(filename).toMatch(/spending-category/);
        expect(filename).toMatch(/\.csv$/);
    });
    test('gate-performance CSV includes rate columns with % suffix', async () => {
        const service = buildService(() => Promise.resolve(perfRows));
        const { buffer, filename } = await service.exportAnalyticsCsv(TENANT, FROM, TO, 'gate-performance');
        const csv = buffer.toString('utf-8');
        expect(csv).toContain('Approval Rate');
        expect(csv).toContain('%');
        expect(filename).toMatch(/gate-performance/);
    });
    test('client-insights CSV escapes commas in client name', async () => {
        const service = buildService(() => Promise.resolve(clientRows));
        const { buffer, filename } = await service.exportAnalyticsCsv(TENANT, FROM, TO, 'client-insights');
        const csv = buffer.toString('utf-8');
        expect(csv).toContain('"Test, Inc"');
        expect(filename).toMatch(/client-insights/);
    });
});
//# sourceMappingURL=accounting-analytics.spec.js.map