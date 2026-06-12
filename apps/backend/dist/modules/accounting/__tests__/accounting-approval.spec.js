"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const accounting_service_1 = require("../accounting.service");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const USER = 'user-uuid-1';
const mockNotifications = {
    notifyExpenseDecision: jest.fn().mockResolvedValue(undefined),
    notifyReadyForReview: jest.fn().mockResolvedValue(undefined),
};
const mockRedis = {
    cacheGet: jest.fn().mockResolvedValue(null),
    cacheSet: jest.fn().mockResolvedValue(undefined),
    cacheDelete: jest.fn().mockResolvedValue(undefined),
};
function buildService(expenseExists = true) {
    const queryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (sql.includes('SELECT e.id FROM expenses')) {
            return Promise.resolve(expenseExists ? [{ id: EXPENSE }] : []);
        }
        return Promise.resolve([]);
    });
    const ds = {
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: queryMock })),
    };
    const mockSignedUrlService = { getSignedUrl: jest.fn().mockImplementation((u) => Promise.resolve(u)) };
    const service = new accounting_service_1.AccountingService(ds, mockNotifications, mockRedis, mockSignedUrlService);
    return { service, queryMock };
}
beforeEach(() => {
    jest.clearAllMocks();
});
describe('AccountingService.markReviewed', () => {
    test('throws NotFoundException when expense not found for tenant', async () => {
        const { service } = buildService(false);
        await expect(service.markReviewed(EXPENSE, TENANT, USER)).rejects.toThrow(common_1.NotFoundException);
    });
    test('issues UPDATE setting approval_decision = approved', async () => {
        const { service, queryMock } = buildService();
        await service.markReviewed(EXPENSE, TENANT, USER, 'LGTM');
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE expenses'));
        expect(updateCall).toBeDefined();
        expect(updateCall[0]).toContain("approval_decision      = 'approved'");
        expect(updateCall[1]).toEqual([USER, 'LGTM', EXPENSE]);
    });
    test('passes null note when none provided', async () => {
        const { service, queryMock } = buildService();
        await service.markReviewed(EXPENSE, TENANT, USER);
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE expenses'));
        expect(updateCall[1][1]).toBeNull();
    });
    test('fires notifyExpenseDecision with approved decision', async () => {
        const { service } = buildService();
        await service.markReviewed(EXPENSE, TENANT, USER, 'ok');
        await Promise.resolve();
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith(EXPENSE, TENANT, 'approved', 'ok');
    });
});
describe('AccountingService.rejectExpense', () => {
    test('throws NotFoundException when expense not found for tenant', async () => {
        const { service } = buildService(false);
        await expect(service.rejectExpense(EXPENSE, TENANT, USER)).rejects.toThrow(common_1.NotFoundException);
    });
    test('issues UPDATE setting approval_decision = rejected and status = rejected', async () => {
        const { service, queryMock } = buildService();
        await service.rejectExpense(EXPENSE, TENANT, USER, 'Missing receipt');
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE expenses'));
        expect(updateCall).toBeDefined();
        expect(updateCall[0]).toContain("approval_decision      = 'rejected'");
        expect(updateCall[0]).toContain("status                 = 'rejected'");
        expect(updateCall[1]).toEqual([USER, 'Missing receipt', EXPENSE]);
    });
    test('fires notifyExpenseDecision with rejected decision and note', async () => {
        const { service } = buildService();
        await service.rejectExpense(EXPENSE, TENANT, USER, 'Missing receipt');
        await Promise.resolve();
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith(EXPENSE, TENANT, 'rejected', 'Missing receipt');
    });
    test('fires notification even when no note is provided', async () => {
        const { service } = buildService();
        await service.rejectExpense(EXPENSE, TENANT, USER);
        await Promise.resolve();
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith(EXPENSE, TENANT, 'rejected', undefined);
    });
});
describe('AccountingService.unmarkReviewed', () => {
    test('throws NotFoundException when expense not found for tenant', async () => {
        const { service } = buildService(false);
        await expect(service.unmarkReviewed(EXPENSE, TENANT)).rejects.toThrow(common_1.NotFoundException);
    });
    test('issues UPDATE clearing all review fields and approval_decision', async () => {
        const { service, queryMock } = buildService();
        await service.unmarkReviewed(EXPENSE, TENANT);
        const updateCall = queryMock.mock.calls.find(([s]) => s.includes('UPDATE expenses'));
        expect(updateCall).toBeDefined();
        const sql = updateCall[0];
        expect(sql).toContain('accountant_reviewed_at = NULL');
        expect(sql).toContain('approval_decision      = NULL');
        expect(sql).toContain('reviewer_note          = NULL');
    });
    test('does not fire any notification', async () => {
        const { service } = buildService();
        await service.unmarkReviewed(EXPENSE, TENANT);
        await Promise.resolve();
        expect(mockNotifications.notifyExpenseDecision).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=accounting-approval.spec.js.map