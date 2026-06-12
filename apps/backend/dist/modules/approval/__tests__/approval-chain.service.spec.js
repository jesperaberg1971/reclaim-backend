"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const approval_chain_service_1 = require("../approval-chain.service");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const USER = 'user-uuid-1';
const mockNotifications = {
    notifyExpenseDecision: jest.fn().mockResolvedValue(undefined),
    notifyReadyForReview: jest.fn().mockResolvedValue(undefined),
    notifyManagerApprovalRequired: jest.fn().mockResolvedValue(undefined),
    notifyAccountantStepReady: jest.fn().mockResolvedValue(undefined),
};
function makeStep(order, type, status = 'pending', overrides = {}) {
    return {
        id: `step-${order}`,
        step_order: order,
        step_type: type,
        status,
        decided_by: null,
        decided_at: null,
        note: null,
        ...overrides,
    };
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
describe('ApprovalChainService.getChain', () => {
    test('returns no_chain when no steps exist', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.getChain(EXPENSE, TENANT);
        expect(result.overall_status).toBe('no_chain');
        expect(result.steps).toHaveLength(0);
        expect(result.current_step_type).toBeNull();
    });
    test('single accountant step pending → overall_status = pending', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'accountant')]));
        const result = await service.getChain(EXPENSE, TENANT);
        expect(result.overall_status).toBe('pending');
        expect(result.current_step_type).toBe('accountant');
        expect(result.steps).toHaveLength(1);
    });
    test('two-step chain: manager approved, accountant pending', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'manager', 'approved'), makeStep(2, 'accountant')]));
        const result = await service.getChain(EXPENSE, TENANT);
        expect(result.current_step_type).toBe('accountant');
        expect(result.overall_status).toBe('pending');
    });
    test('all steps approved → fully_approved', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'accountant', 'approved')]));
        const result = await service.getChain(EXPENSE, TENANT);
        expect(result.overall_status).toBe('fully_approved');
        expect(result.current_step_type).toBeNull();
    });
    test('rejected step → overall_status = rejected', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'manager', 'rejected'), makeStep(2, 'accountant', 'skipped')]));
        const result = await service.getChain(EXPENSE, TENANT);
        expect(result.overall_status).toBe('rejected');
    });
});
describe('ApprovalChainService.approveStep', () => {
    test('throws NotFoundException when no chain exists', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.approveStep(EXPENSE, TENANT, USER, 'partner_admin')).rejects.toThrow(common_1.NotFoundException);
    });
    test('throws BadRequestException when all steps already completed', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'accountant', 'approved')]));
        await expect(service.approveStep(EXPENSE, TENANT, USER, 'partner_admin')).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws ForbiddenException when role does not match step', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'accountant')]));
        await expect(service.approveStep(EXPENSE, TENANT, USER, 'client_admin')).rejects.toThrow(common_1.ForbiddenException);
    });
    test('throws ForbiddenException when partner_admin tries manager step', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'manager')]));
        await expect(service.approveStep(EXPENSE, TENANT, USER, 'partner_admin')).rejects.toThrow(common_1.ForbiddenException);
    });
    test('partner_admin approves accountant step in single-step chain → all done', async () => {
        let stepUpdateCalled = false;
        let expenseUpdateCalled = false;
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE'))
                return Promise.resolve([makeStep(1, 'accountant')]);
            if (sql.includes('expense_approval_steps') && sql.includes('SET status')) {
                stepUpdateCalled = true;
                return Promise.resolve([]);
            }
            if (sql.includes('UPDATE expenses')) {
                expenseUpdateCalled = true;
                return Promise.resolve([]);
            }
            return Promise.resolve([makeStep(1, 'accountant', 'approved', { decided_by: USER })]);
        });
        const result = await service.approveStep(EXPENSE, TENANT, USER, 'partner_admin', 'LGTM');
        expect(stepUpdateCalled).toBe(true);
        expect(expenseUpdateCalled).toBe(true);
        expect(result.overall_status).toBe('fully_approved');
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith(EXPENSE, TENANT, 'approved', 'LGTM');
    });
    test('client_admin approves manager step → accountant step becomes current, notifies accountant', async () => {
        let expenseUpdateCalled = false;
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE')) {
                return Promise.resolve([makeStep(1, 'manager'), makeStep(2, 'accountant')]);
            }
            if (sql.includes('UPDATE expenses')) {
                expenseUpdateCalled = true;
                return Promise.resolve([]);
            }
            if (sql.includes('expense_approval_steps') && sql.includes('SET status'))
                return Promise.resolve([]);
            return Promise.resolve([makeStep(1, 'manager', 'approved'), makeStep(2, 'accountant')]);
        });
        const result = await service.approveStep(EXPENSE, TENANT, USER, 'client_admin');
        expect(expenseUpdateCalled).toBe(false);
        expect(result.current_step_type).toBe('accountant');
        expect(result.overall_status).toBe('pending');
        expect(mockNotifications.notifyAccountantStepReady).toHaveBeenCalledWith(TENANT, EXPENSE);
        expect(mockNotifications.notifyExpenseDecision).not.toHaveBeenCalled();
    });
});
describe('ApprovalChainService.rejectStep', () => {
    test('throws NotFoundException when no chain', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.rejectStep(EXPENSE, TENANT, USER, 'client_admin')).rejects.toThrow(common_1.NotFoundException);
    });
    test('throws ForbiddenException when wrong role', async () => {
        const { service } = buildService(() => Promise.resolve([makeStep(1, 'manager')]));
        await expect(service.rejectStep(EXPENSE, TENANT, USER, 'partner_admin')).rejects.toThrow(common_1.ForbiddenException);
    });
    test('rejects current step + skips remaining + updates expense', async () => {
        let stepRejectCalled = false;
        let stepSkipCalled = false;
        let expenseRejected = false;
        const { service } = buildService((sql) => {
            if (sql.includes('FOR UPDATE')) {
                return Promise.resolve([makeStep(1, 'manager'), makeStep(2, 'accountant')]);
            }
            if (sql.includes("SET status = 'rejected'")) {
                stepRejectCalled = true;
                return Promise.resolve([]);
            }
            if (sql.includes("SET status = 'skipped'")) {
                stepSkipCalled = true;
                return Promise.resolve([]);
            }
            if (sql.includes('UPDATE expenses')) {
                expenseRejected = true;
                return Promise.resolve([]);
            }
            return Promise.resolve([
                makeStep(1, 'manager', 'rejected'),
                makeStep(2, 'accountant', 'skipped'),
            ]);
        });
        const result = await service.rejectStep(EXPENSE, TENANT, USER, 'client_admin', 'Not approved');
        expect(stepRejectCalled).toBe(true);
        expect(stepSkipCalled).toBe(true);
        expect(expenseRejected).toBe(true);
        expect(result.overall_status).toBe('rejected');
        expect(mockNotifications.notifyExpenseDecision).toHaveBeenCalledWith(EXPENSE, TENANT, 'rejected', 'Not approved');
    });
});
describe('ApprovalChainService.getPendingQueue', () => {
    const queueRow = {
        expense_id: EXPENSE,
        receipt_date: new Date('2026-06-01'),
        employee_name: 'Nguyễn Văn A',
        client_name: 'Cty ABC',
        original_amount: '500000.0000',
        gate_applied: 2,
        step_pending_since: new Date('2026-06-02'),
    };
    test('partner_admin gets accountant-step queue with blocking check', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([queueRow]));
        const result = await service.getPendingQueue(TENANT, 'partner_admin');
        expect(result).toHaveLength(1);
        expect(result[0].pending_step_type).toBe('accountant');
        expect(result[0].expense_id).toBe(EXPENSE);
        const queueCall = queryMock.mock.calls.find(([s]) => s.includes('NOT EXISTS'));
        expect(queueCall).toBeDefined();
    });
    test('client_admin gets manager-step queue', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([queueRow]));
        const result = await service.getPendingQueue(TENANT, 'client_admin');
        expect(result[0].pending_step_type).toBe('manager');
        const queueCall = queryMock.mock.calls.find(([s]) => s.includes("step_type  = $2"));
        expect(queueCall).toBeDefined();
    });
    test('client_admin with clientId filters by client', async () => {
        const CLIENT = 'client-uuid-1';
        const { service, queryMock } = buildService(() => Promise.resolve([queueRow]));
        await service.getPendingQueue(TENANT, 'client_admin', CLIENT);
        const queueCall = queryMock.mock.calls.find(([s]) => s.includes('client_id'));
        expect(queueCall).toBeDefined();
        expect(queueCall[1]).toContain(CLIENT);
    });
    test('unknown role returns empty array', async () => {
        const { service } = buildService(() => Promise.resolve([queueRow]));
        const result = await service.getPendingQueue(TENANT, 'employee');
        expect(result).toEqual([]);
    });
    test('returns empty when no pending steps', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.getPendingQueue(TENANT, 'partner_admin');
        expect(result).toEqual([]);
    });
});
//# sourceMappingURL=approval-chain.service.spec.js.map