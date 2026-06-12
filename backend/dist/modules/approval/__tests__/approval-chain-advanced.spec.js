"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const approval_chain_service_1 = require("../approval-chain.service");
const TENANT = 'tenant-uuid-1';
const USER = 'user-uuid-1';
const mockNotifications = {
    notifyExpenseDecision: jest.fn().mockResolvedValue(undefined),
    notifyAccountantStepReady: jest.fn().mockResolvedValue(undefined),
    notifyManagerApprovalRequired: jest.fn().mockResolvedValue(undefined),
    notifyReadyForReview: jest.fn().mockResolvedValue(undefined),
};
function makeStep(order, type, status = 'pending') {
    return { id: `step-${order}`, step_order: order, step_type: type, status, decided_by: null, decided_at: null, note: null };
}
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
    const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new approval_chain_service_1.ApprovalChainService(ds, mockNotifications, mockAudit);
    return { service, queryMock };
}
beforeEach(() => jest.clearAllMocks());
describe('ApprovalChainService.bulkApprove', () => {
    test('all succeed → succeeded list is full, failed is empty', async () => {
        let callCount = 0;
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE')) {
                callCount++;
                return Promise.resolve([makeStep(1, 'accountant')]);
            }
            if (sql.includes('SET status'))
                return Promise.resolve([]);
            if (sql.includes('UPDATE expenses'))
                return Promise.resolve([]);
            return Promise.resolve([makeStep(1, 'accountant', 'approved')]);
        });
        const result = await service.bulkApprove(['exp-1', 'exp-2'], TENANT, USER, 'partner_admin');
        expect(result.succeeded).toEqual(['exp-1', 'exp-2']);
        expect(result.failed).toHaveLength(0);
    });
    test('one expense has no chain → that one fails, rest succeed', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await service.bulkApprove(['bad-exp', 'bad-exp-2'], TENANT, USER, 'partner_admin');
        expect(result.succeeded).toHaveLength(0);
        expect(result.failed).toHaveLength(2);
        expect(result.failed[0].expenseId).toBe('bad-exp');
        expect(result.failed[0].error).toMatch(/No approval chain/i);
    });
    test('wrong role → fails in failed list, not thrown', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE'))
                return Promise.resolve([makeStep(1, 'accountant')]);
            return Promise.resolve([]);
        });
        const result = await service.bulkApprove(['exp-1'], TENANT, USER, 'client_admin');
        expect(result.succeeded).toHaveLength(0);
        expect(result.failed[0].error).toMatch(/client_admin|requires/i);
        expect(result.failed[0].expenseId).toBe('exp-1');
    });
});
describe('ApprovalChainService.bulkReject', () => {
    test('all succeed', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE'))
                return Promise.resolve([makeStep(1, 'manager')]);
            if (sql.includes("SET status = 'rejected'"))
                return Promise.resolve([]);
            if (sql.includes("SET status = 'skipped'"))
                return Promise.resolve([]);
            if (sql.includes('UPDATE expenses'))
                return Promise.resolve([]);
            return Promise.resolve([makeStep(1, 'manager', 'rejected')]);
        });
        const result = await service.bulkReject(['exp-1', 'exp-2'], TENANT, USER, 'client_admin', 'out of policy');
        expect(result.succeeded).toEqual(['exp-1', 'exp-2']);
        expect(result.failed).toHaveLength(0);
    });
    test('partial failure — bad expense error captured without throwing', async () => {
        let firstCall = true;
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE')) {
                if (firstCall) {
                    firstCall = false;
                    return Promise.resolve([]);
                }
                return Promise.resolve([makeStep(1, 'manager')]);
            }
            if (sql.includes("SET status = 'rejected'"))
                return Promise.resolve([]);
            if (sql.includes("SET status = 'skipped'"))
                return Promise.resolve([]);
            if (sql.includes('UPDATE expenses'))
                return Promise.resolve([]);
            return Promise.resolve([makeStep(1, 'manager', 'rejected')]);
        });
        const result = await service.bulkReject(['bad-exp', 'good-exp'], TENANT, USER, 'client_admin');
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].expenseId).toBe('bad-exp');
        expect(result.succeeded).toEqual(['good-exp']);
    });
});
describe('ApprovalChainService.skipManagerStepsForTenant', () => {
    test('skips all pending manager steps and notifies accountants', async () => {
        const affectedIds = ['exp-a', 'exp-b'];
        let skipCalled = false;
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE expense_approval_steps')) {
                skipCalled = true;
                return Promise.resolve(affectedIds.map((id) => ({ expense_id: id })));
            }
            return Promise.resolve([]);
        });
        await service.skipManagerStepsForTenant(TENANT);
        expect(skipCalled).toBe(true);
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledTimes(2);
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledWith(TENANT, 'exp-a');
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledWith(TENANT, 'exp-b');
    });
    test('no-op when no pending manager steps exist', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('UPDATE expense_approval_steps'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await service.skipManagerStepsForTenant(TENANT);
        expect(mockNotifications.notifyAccountantStepReady).not.toHaveBeenCalled();
    });
});
describe('ApprovalChainService.escalateStep', () => {
    const managerStep = { id: 'step-1', expense_id: 'exp-1', step_type: 'manager' };
    const accountantStep = { id: 'step-2', expense_id: 'exp-1', step_type: 'accountant' };
    test('manager step escalated with remaining pending → manager_escalated outcome', async () => {
        const { service } = buildService(() => Promise.resolve([{ id: 'step-2' }]));
        const txManager = {
            query: jest.fn().mockImplementation((sql) => {
                if (sql.includes('SET status'))
                    return Promise.resolve([]);
                return Promise.resolve([{ id: 'step-2' }]);
            }),
        };
        const outcome = await service.escalateStep(managerStep, txManager);
        expect(outcome.type).toBe('manager_escalated');
        expect(outcome.expenseId).toBe('exp-1');
        const expenseUpdated = txManager.query.mock.calls.some(([s]) => s.includes('UPDATE expenses'));
        expect(expenseUpdated).toBe(false);
    });
    test('final step escalated → all_done outcome + marks expense approved', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const txManager = {
            query: jest.fn().mockImplementation((sql) => {
                if (sql.includes('SET status') && sql.includes('is_escalated'))
                    return Promise.resolve([]);
                if (sql.includes('status = \'pending\''))
                    return Promise.resolve([]);
                if (sql.includes('UPDATE expenses'))
                    return Promise.resolve([]);
                return Promise.resolve([]);
            }),
        };
        const outcome = await service.escalateStep(accountantStep, txManager);
        expect(outcome.type).toBe('all_done');
        expect(outcome.expenseId).toBe('exp-1');
        const expenseUpdated = txManager.query.mock.calls.some(([s]) => s.includes('UPDATE expenses') && s.includes('approved'));
        expect(expenseUpdated).toBe(true);
    });
    test('escalated step is marked is_escalated = true in SQL', async () => {
        const { service } = buildService(() => Promise.resolve([{ id: 'step-2' }]));
        const txManager = {
            query: jest.fn().mockImplementation((sql) => {
                if (sql.includes('status = \'pending\''))
                    return Promise.resolve([{ id: 'step-2' }]);
                return Promise.resolve([]);
            }),
        };
        await service.escalateStep(managerStep, txManager);
        const updateCall = txManager.query.mock.calls.find(([s]) => s.includes('is_escalated'));
        expect(updateCall).toBeDefined();
        expect(updateCall[0]).toContain('is_escalated = true');
    });
});
//# sourceMappingURL=approval-chain-advanced.spec.js.map