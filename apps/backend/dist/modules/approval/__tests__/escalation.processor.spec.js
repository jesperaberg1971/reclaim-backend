"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escalation_processor_1 = require("../escalation.processor");
const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const staleStep = { id: 'step-1', expense_id: 'exp-1', step_type: 'manager' };
const mockNotifications = {
    notifyExpenseDecision: jest.fn().mockResolvedValue(undefined),
    notifyAccountantStepReady: jest.fn().mockResolvedValue(undefined),
};
const mockChainService = {
    escalateStep: jest.fn(),
};
function buildProcessor(partnerRows) {
    const txQueryMock = jest.fn().mockImplementation((sql) => {
        if (sql.includes('set_config'))
            return Promise.resolve([]);
        if (sql.includes('FROM expense_approval_steps'))
            return Promise.resolve([staleStep]);
        return Promise.resolve([]);
    });
    const ds = {
        query: jest.fn().mockResolvedValue(partnerRows),
        transaction: jest.fn().mockImplementation(async (cb) => cb({ query: txQueryMock })),
    };
    const processor = new escalation_processor_1.EscalationProcessor(ds, mockChainService, mockNotifications);
    return { processor, ds, txQueryMock };
}
beforeEach(() => jest.clearAllMocks());
const fakeJob = {};
describe('EscalationProcessor', () => {
    test('no partners configured → escalateStep never called', async () => {
        const { processor } = buildProcessor([]);
        await processor.process(fakeJob);
        expect(mockChainService.escalateStep).not.toHaveBeenCalled();
        expect(mockNotifications.notifyExpenseDecision).not.toHaveBeenCalled();
    });
    test('manager_escalated outcome → notifies accountant step ready', async () => {
        const outcome = { type: 'manager_escalated', expenseId: 'exp-1' };
        mockChainService.escalateStep.mockResolvedValue(outcome);
        const { processor } = buildProcessor([{ id: TENANT_A, hours: 48 }]);
        await processor.process(fakeJob);
        expect(mockChainService.escalateStep).toHaveBeenCalledWith(staleStep, expect.any(Object));
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledWith(TENANT_A, 'exp-1');
        expect(mockNotifications.notifyExpenseDecision).not.toHaveBeenCalled();
    });
    test('all_done outcome → notifies expense decision approved', async () => {
        const outcome = { type: 'all_done', expenseId: 'exp-1' };
        mockChainService.escalateStep.mockResolvedValue(outcome);
        const { processor } = buildProcessor([{ id: TENANT_A, hours: 24 }]);
        await processor.process(fakeJob);
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith('exp-1', TENANT_A, 'approved', expect.stringContaining('Auto-escalated'));
        expect(mockNotifications.notifyAccountantStepReady).not.toHaveBeenCalled();
    });
    test('error in one tenant does not abort processing of other tenants', async () => {
        mockChainService.escalateStep.mockResolvedValue({ type: 'manager_escalated', expenseId: 'exp-2' });
        const txQueryMock = jest.fn().mockImplementation((sql) => {
            if (sql.includes('set_config'))
                return Promise.resolve([]);
            if (sql.includes('FROM expense_approval_steps'))
                return Promise.resolve([staleStep]);
            return Promise.resolve([]);
        });
        let callIndex = 0;
        const ds = {
            query: jest.fn().mockResolvedValue([
                { id: TENANT_A, hours: 48 },
                { id: TENANT_B, hours: 24 },
            ]),
            transaction: jest.fn().mockImplementation(async (cb) => {
                if (callIndex++ === 0)
                    throw new Error('DB timeout');
                return cb({ query: txQueryMock });
            }),
        };
        const processor = new escalation_processor_1.EscalationProcessor(ds, mockChainService, mockNotifications);
        await expect(processor.process(fakeJob)).resolves.not.toThrow();
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledWith(TENANT_B, 'exp-2');
    });
    test('stale step query uses is_escalated = false and make_interval', async () => {
        mockChainService.escalateStep.mockResolvedValue({ type: 'manager_escalated', expenseId: 'exp-1' });
        const { processor, txQueryMock } = buildProcessor([{ id: TENANT_A, hours: 72 }]);
        await processor.process(fakeJob);
        const staleQuery = txQueryMock.mock.calls.find(([s]) => s.includes('is_escalated') && s.includes('make_interval'));
        expect(staleQuery).toBeDefined();
        expect(staleQuery[1]).toContain(72);
    });
});
//# sourceMappingURL=escalation.processor.spec.js.map