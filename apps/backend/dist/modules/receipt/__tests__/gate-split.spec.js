"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const notifications_service_1 = require("../../notifications/notifications.service");
const gate1_evaluator_1 = require("../gate-engine/gate1.evaluator");
const gate2_evaluator_1 = require("../gate-engine/gate2.evaluator");
const receipt_processing_service_1 = require("../receipt-processing.service");
const receipt_processing_service_2 = require("../receipt-processing.service");
const expense_repository_1 = require("../repositories/expense.repository");
const trip_decision_repository_1 = require("../repositories/trip-decision.repository");
const partner_repository_1 = require("../repositories/partner.repository");
const expense_entity_1 = require("../../../database/entities/expense.entity");
const queue_constants_1 = require("../../queue/queue.constants");
const d = (n) => new decimal_js_1.Decimal(n);
const CAP_300K = {
    id: 'trip-1',
    status: 'approved',
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-06-05'),
    daily_allowance_amount: d(300_000),
};
const RECEIPT_DATE = new Date('2026-06-03');
const MEAL_CAP = d(150_000);
const MONTHLY_CAP = d(3_000_000);
const ZERO_USED = d(0);
const CARD_LIMIT = d(5_000_000);
describe('Gate split — route() decision (500k receipt, 300k cap)', () => {
    let decision;
    beforeAll(() => {
        decision = (0, receipt_processing_service_1.route)(d(500_000), RECEIPT_DATE, CAP_300K, 'cash', MEAL_CAP, MONTHLY_CAP, ZERO_USED, CARD_LIMIT, false);
    });
    test('routes to Gate 1', () => {
        expect(decision.gate).toBe(1);
    });
    test('parent final_amount_deductible = 300 000 VND', () => {
        expect(decision.finalAmountDeductible.equals(d(300_000))).toBe(true);
    });
    test('parent category is TRAVEL_ALLOWANCE', () => {
        expect(decision.finalCategory).toBe(expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE);
    });
    test('parent pit_flag is false (per-diem is tax-exempt)', () => {
        expect(decision.pitFlag).toBe(false);
    });
    test('childAmount is 200 000 VND (overflow to Gate 2)', () => {
        expect(decision.childAmount).toBeDefined();
        expect(decision.childAmount.equals(d(200_000))).toBe(true);
    });
    test('parent status is APPROVED', () => {
        expect(decision.status).toBe(expense_entity_1.ExpenseStatus.APPROVED);
    });
});
describe('Gate split — child Gate 2 evaluation (200k overflow)', () => {
    const CHILD_AMOUNT = d(200_000);
    test('200k overflow fits within meal cap and fresh welfare → fully deductible', () => {
        const g2 = (0, gate2_evaluator_1.evaluateGate2)(CHILD_AMOUNT, MEAL_CAP, MONTHLY_CAP, ZERO_USED);
        expect(g2.deductible.equals(d(150_000))).toBe(true);
        expect(g2.pitFlag).toBe(true);
    });
    test('200k overflow within meal cap (200k cap) → fully deductible, no PIT', () => {
        const g2 = (0, gate2_evaluator_1.evaluateGate2)(CHILD_AMOUNT, d(200_000), MONTHLY_CAP, ZERO_USED);
        expect(g2.deductible.equals(d(200_000))).toBe(true);
        expect(g2.pitFlag).toBe(false);
    });
    test('200k overflow with nearly exhausted welfare → partial deductible', () => {
        const welfareUsed = d(2_900_000);
        const g2 = (0, gate2_evaluator_1.evaluateGate2)(CHILD_AMOUNT, MEAL_CAP, MONTHLY_CAP, welfareUsed);
        expect(g2.deductible.equals(d(100_000))).toBe(true);
        expect(g2.pitFlag).toBe(true);
    });
    test('200k overflow with exhausted welfare → zero deductible, full PIT', () => {
        const g2 = (0, gate2_evaluator_1.evaluateGate2)(CHILD_AMOUNT, MEAL_CAP, MONTHLY_CAP, d(3_000_000));
        expect(g2.deductible.isZero()).toBe(true);
        expect(g2.pitFlag).toBe(true);
    });
    test('conservation: parent(300k) + child(200k) = original(500k)', () => {
        const gate1Result = (0, gate1_evaluator_1.evaluateGate1)(d(500_000), RECEIPT_DATE, CAP_300K);
        expect(gate1Result.deductible.plus(gate1Result.overflow).equals(d(500_000))).toBe(true);
    });
});
describe('ReceiptProcessingService — parent + child records created', () => {
    let service;
    let savedExpenses;
    let updatedExpenses;
    let mockManager;
    const EXPENSE_ID = 'expense-uuid-1';
    const CHILD_ID = 'child-uuid-1';
    const TENANT_ID = 'tenant-uuid-1';
    const CLIENT_ID = 'client-uuid-1';
    const EMPLOYEE_ID = 'employee-uuid-1';
    const MOCK_EXPENSE = {
        id: EXPENSE_ID,
        client_id: CLIENT_ID,
        employee_id: EMPLOYEE_ID,
        receipt_date: RECEIPT_DATE,
        original_amount: '500000.0000',
        currency: 'VND',
        receipt_image_url: '',
        ocr_raw_json: { paymentMethod: 'cash' },
    };
    const MOCK_POLICIES = {
        meal_cap_vnd: 150_000,
        per_diem_daily_vnd: 700_000,
        welfare_monthly_cap_vnd: 3_000_000,
        personal_card_limit_vnd: 5_000_000,
    };
    const MOCK_TRIP_ROW = {
        id: 'trip-uuid-1',
        status: 'approved',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
        daily_allowance_amount: '300000.0000',
        destination: 'Thành phố Hồ Chí Minh',
        purpose: 'Họp đối tác',
    };
    beforeEach(async () => {
        savedExpenses = [];
        updatedExpenses = [];
        mockManager = {
            query: jest.fn().mockImplementation((sql) => {
                if (sql.includes('set_config'))
                    return Promise.resolve([]);
                if (sql.includes('FROM partners'))
                    return Promise.resolve([{ policies: MOCK_POLICIES }]);
                if (sql.includes('FROM trip_decisions'))
                    return Promise.resolve([MOCK_TRIP_ROW]);
                if (sql.includes('FROM welfare_balances'))
                    return Promise.resolve([{ used: '0' }]);
                if (sql.includes('INSERT INTO welfare_balances'))
                    return Promise.resolve([]);
                if (sql.includes('FROM employees'))
                    return Promise.resolve([{ full_name: 'Nguyễn Văn A', employee_id: 'EMP-001' }]);
                if (sql.includes('FROM clients'))
                    return Promise.resolve([{ name: 'Công ty ABC' }]);
                if (sql.includes('supporting_documents'))
                    return Promise.resolve([{ supporting_documents: [] }]);
                if (sql.includes('UPDATE expenses SET supporting'))
                    return Promise.resolve([]);
                return Promise.resolve([]);
            }),
            findOne: jest.fn().mockImplementation((EntityClass, _opts) => {
                const name = EntityClass?.name ?? String(EntityClass);
                if (name === 'Expense')
                    return Promise.resolve(MOCK_EXPENSE);
                return Promise.resolve(null);
            }),
            update: jest.fn().mockImplementation((_Entity, id, fields) => {
                updatedExpenses.push({ id, ...fields });
                return Promise.resolve();
            }),
            create: jest.fn().mockImplementation((_Entity, data) => ({
                ...data,
                id: CHILD_ID,
            })),
            save: jest.fn().mockImplementation((_Entity, entity) => {
                savedExpenses.push(entity);
                return Promise.resolve(entity);
            }),
        };
        const mockDataSource = {
            transaction: jest.fn().mockImplementation(async (callback) => callback(mockManager)),
        };
        const mockPdfQueue = { add: jest.fn().mockResolvedValue({ id: 'job-test-1' }) };
        const mockNotificationsService = { notifyReadyForReview: jest.fn().mockResolvedValue(undefined) };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                receipt_processing_service_2.ReceiptProcessingService,
                { provide: expense_repository_1.ExpenseRepository, useValue: {} },
                { provide: trip_decision_repository_1.TripDecisionRepository, useValue: {} },
                { provide: partner_repository_1.PartnerRepository, useValue: {} },
                { provide: typeorm_1.DataSource, useValue: mockDataSource },
                { provide: notifications_service_1.NotificationsService, useValue: mockNotificationsService },
                { provide: (0, bullmq_1.getQueueToken)(queue_constants_1.PDF_GENERATION_QUEUE), useValue: mockPdfQueue },
            ],
        }).compile();
        service = module.get(receipt_processing_service_2.ReceiptProcessingService);
        service._mockPdfQueue = mockPdfQueue;
    });
    test('processes without throwing', async () => {
        await expect(service.processExpense(EXPENSE_ID, TENANT_ID)).resolves.toBeDefined();
    });
    test('parent record is updated with gate_applied = 1', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const parent = updatedExpenses.find((e) => e.id === EXPENSE_ID);
        expect(parent).toBeDefined();
        expect(parent.gate_applied).toBe(1);
    });
    test('parent final_amount_deductible = 300 000 VND', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const parent = updatedExpenses.find((e) => e.id === EXPENSE_ID);
        expect(new decimal_js_1.Decimal(String(parent.final_amount_deductible)).equals(d(300_000))).toBe(true);
    });
    test('parent category is TRAVEL_ALLOWANCE', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const parent = updatedExpenses.find((e) => e.id === EXPENSE_ID);
        expect(parent.final_category).toBe(expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE);
    });
    test('parent pit_flag is false', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const parent = updatedExpenses.find((e) => e.id === EXPENSE_ID);
        expect(parent.pit_flag).toBe(false);
    });
    test('child record is created (save() called once)', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        expect(savedExpenses).toHaveLength(1);
    });
    test('child original_amount = 200 000 VND (the overflow)', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const child = savedExpenses[0];
        expect(new decimal_js_1.Decimal(String(child.original_amount)).equals(d(200_000))).toBe(true);
    });
    test('child gate_applied = 2', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const child = savedExpenses[0];
        expect(child.gate_applied).toBe(2);
    });
    test('child parent_expense_id links back to the parent', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const child = savedExpenses[0];
        expect(child.parent_expense_id).toBe(EXPENSE_ID);
    });
    test('child category is WELFARE_ALLOWANCE', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const child = savedExpenses[0];
        expect(child.final_category).toBe(expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE);
    });
    test('child final_amount_deductible ≤ meal cap (150 000 VND)', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const child = savedExpenses[0];
        const deductible = new decimal_js_1.Decimal(String(child.final_amount_deductible));
        expect(deductible.lte(d(150_000))).toBe(true);
    });
    test('DoD — PDF job is enqueued when Gate 1 succeeds', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const q = service._mockPdfQueue;
        expect(q.add).toHaveBeenCalledTimes(1);
        expect(q.add).toHaveBeenCalledWith('generate-trip-decision-pdf', expect.objectContaining({ expenseId: EXPENSE_ID, tenantId: TENANT_ID }), expect.objectContaining({ attempts: 4 }));
    });
    test('DoD — PDF job payload contains correct expense identifiers', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const q = service._mockPdfQueue;
        const [, payload] = q.add.mock.calls[0];
        expect(payload.expense.employee_id).toBe(EMPLOYEE_ID);
        expect(payload.expense.client_id).toBe(CLIENT_ID);
    });
    test('DoD — PDF job payload trip dates match trip decision', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const q = service._mockPdfQueue;
        const [, payload] = q.add.mock.calls[0];
        expect(new Date(payload.tripRow.start_date)).toEqual(new Date('2026-06-01'));
        expect(new Date(payload.tripRow.end_date)).toEqual(new Date('2026-06-05'));
    });
    test('DoD — PDF job payload trip fields match trip decision', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const q = service._mockPdfQueue;
        const [, payload] = q.add.mock.calls[0];
        expect(payload.tripRow.destination).toBe('Thành phố Hồ Chí Minh');
        expect(payload.tripRow.purpose).toBe('Họp đối tác');
        expect(new decimal_js_1.Decimal(payload.tripRow.daily_allowance_amount).equals(d(300_000))).toBe(true);
    });
    test('DoD — queued marker is stored in supporting_documents', async () => {
        await service.processExpense(EXPENSE_ID, TENANT_ID);
        const updateCalls = mockManager.query.mock.calls.filter(([sql]) => sql.includes('UPDATE expenses SET supporting'));
        expect(updateCalls.length).toBeGreaterThan(0);
        const lastUpdate = updateCalls[updateCalls.length - 1];
        const storedDocs = JSON.parse(lastUpdate[1][0]);
        const queuedEntry = storedDocs.find((d) => d.type === 'trip_decision_pdf' && d.status === 'queued');
        expect(queuedEntry).toBeDefined();
    });
});
//# sourceMappingURL=gate-split.spec.js.map