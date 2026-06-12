"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const hitl_service_1 = require("../hitl.service");
const bulk_action_dto_1 = require("../dto/bulk-action.dto");
const expense_entity_1 = require("../../../database/entities/expense.entity");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const USER = 'user-uuid-1';
const mockReceiptService = {
    processExpense: jest.fn().mockResolvedValue({
        gate: 1, finalCategory: 'travel_allowance', status: 'approved',
        finalAmountDeductible: { toFixed: () => '500000' },
        pitFlag: false, reason: 'within cap',
    }),
};
const mockRedis = { getOcrMetrics: jest.fn().mockResolvedValue({ period: '2026-06', total: 10 }) };
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
function makeQueueRow(overrides = {}) {
    return {
        id: EXPENSE, receipt_date: new Date('2026-05-15'), original_amount: '350000',
        ocr_raw_json: { vendor: 'Grab', confidence: 0.92, diagnostics: { failure_reasons: [] } },
        created_at: new Date(), employee_name: 'Nguyen Van A', client_name: 'Cty ABC',
        ...overrides,
    };
}
function buildService(expenseExists = true) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (sql.includes('SELECT') && sql.includes('FROM expenses e')) {
            return Promise.resolve(expenseExists ? [makeQueueRow()] : []);
        }
        if (sql.includes('SELECT id, ocr_raw_json')) {
            return Promise.resolve(expenseExists ? [{ id: EXPENSE, ocr_raw_json: {} }] : []);
        }
        return Promise.resolve([]);
    });
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
    };
    const mockSignedUrlService = { getSignedUrl: jest.fn().mockImplementation((u) => Promise.resolve(u)) };
    const service = new hitl_service_1.HitlService(ds, mockReceiptService, mockRedis, mockAudit, mockSignedUrlService);
    return { service, queryMock };
}
beforeEach(() => jest.clearAllMocks());
describe('HitlService.getQueue', () => {
    test('maps queue rows to ReviewQueueItem shape', async () => {
        const { service } = buildService();
        const queue = await service.getQueue(TENANT);
        expect(queue).toHaveLength(1);
        expect(queue[0].id).toBe(EXPENSE);
        expect(queue[0].vendor).toBe('Grab');
        expect(queue[0].ocr_confidence).toBe(0.92);
        expect(queue[0].failure_reasons).toEqual([]);
        expect(typeof queue[0].original_amount.toFixed).toBe('function');
    });
    test('returns empty array for empty queue', async () => {
        const { service } = buildService(false);
        const queue = await service.getQueue(TENANT);
        expect(queue).toEqual([]);
    });
});
describe('HitlService.getDetail', () => {
    test('throws NotFoundException when expense not in queue', async () => {
        const { service } = buildService(false);
        await expect(service.getDetail(EXPENSE, TENANT)).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns ExpenseDetail with all required fields', async () => {
        const { service } = buildService();
        const detail = await service.getDetail(EXPENSE, TENANT);
        expect(detail.id).toBe(EXPENSE);
        expect(detail).toHaveProperty('ocr_raw_json');
        expect(detail).toHaveProperty('employee_name');
        expect(detail).toHaveProperty('client_name');
    });
});
describe('HitlService.rejectExpense', () => {
    test('throws NotFoundException when expense not found', async () => {
        const { service } = buildService(false);
        await expect(service.rejectExpense(EXPENSE, TENANT, 'bad', USER)).rejects.toThrow(common_1.NotFoundException);
    });
    test('updates status to REJECTED', async () => {
        const { service, queryMock } = buildService();
        await service.rejectExpense(EXPENSE, TENANT, 'blurry image', USER);
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE expenses'));
        expect(updateCall).toBeDefined();
        expect(updateCall[1]).toContain(expense_entity_1.ExpenseStatus.REJECTED);
    });
    test('fires audit log after rejection', async () => {
        const { service } = buildService();
        await service.rejectExpense(EXPENSE, TENANT, 'reason', USER);
        await Promise.resolve();
        expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'hitl_reject', resourceId: EXPENSE }));
    });
});
describe('HitlService.bulkAction', () => {
    test('approve: all IDs succeed → succeeded list equals input', async () => {
        const { service } = buildService();
        const ids = ['e-1', 'e-2', 'e-3'];
        const result = await service.bulkAction(ids, bulk_action_dto_1.BulkActionType.APPROVE, TENANT, undefined, USER);
        expect(result.succeeded).toEqual(ids);
        expect(result.failed).toHaveLength(0);
    });
    test('reject: all IDs succeed', async () => {
        const { service } = buildService();
        const ids = ['e-1', 'e-2'];
        const result = await service.bulkAction(ids, bulk_action_dto_1.BulkActionType.REJECT, TENANT, 'batch reject', USER);
        expect(result.succeeded).toEqual(ids);
        expect(result.failed).toHaveLength(0);
    });
    test('partial failure: failed items captured with error message', async () => {
        const { service, queryMock } = buildService();
        let callCount = 0;
        queryMock.mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('SELECT id, ocr_raw_json')) {
                callCount++;
                return Promise.resolve(callCount === 2 ? [] : [{ id: EXPENSE, ocr_raw_json: {} }]);
            }
            return Promise.resolve([]);
        });
        const result = await service.bulkAction(['e-1', 'e-2'], bulk_action_dto_1.BulkActionType.APPROVE, TENANT);
        expect(result.succeeded).toHaveLength(1);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].error).toBeTruthy();
    });
    test('all fail: returns empty succeeded and all in failed', async () => {
        const { service } = buildService(false);
        const result = await service.bulkAction(['e-1', 'e-2'], bulk_action_dto_1.BulkActionType.REJECT, TENANT);
        expect(result.succeeded).toHaveLength(0);
        expect(result.failed).toHaveLength(2);
    });
});
describe('HitlService.getOcrMetrics', () => {
    test('delegates to RedisService.getOcrMetrics with period', async () => {
        const { service } = buildService();
        const result = await service.getOcrMetrics('2026-06');
        expect(mockRedis.getOcrMetrics).toHaveBeenCalledWith('2026-06');
        expect(result).toEqual({ period: '2026-06', total: 10 });
    });
    test('delegates with undefined period when not provided', async () => {
        const { service } = buildService();
        await service.getOcrMetrics();
        expect(mockRedis.getOcrMetrics).toHaveBeenCalledWith(undefined);
    });
});
//# sourceMappingURL=hitl.service.spec.js.map