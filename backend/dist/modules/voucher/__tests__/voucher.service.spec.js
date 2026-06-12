"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const decimal_js_1 = require("decimal.js");
const voucher_service_1 = require("../voucher.service");
const EXPENSE_ID = 'abcdef12-0000-0000-0000-000000000001';
const TENANT_ID = 'tenant-uuid-1';
const EMPLOYEE_ID = 'emp-uuid-1';
function makeExpense(overrides = {}) {
    return {
        id: EXPENSE_ID,
        employee_id: EMPLOYEE_ID,
        receipt_date: new Date('2026-06-01'),
        final_amount_deductible: new decimal_js_1.Decimal('500000'),
        final_category: 'personal_card_reimbursement',
        gate_applied: 3,
        receipt_image_url: '/api/files/receipts/exp.jpg',
        employee: { full_name: 'Nguyen Van A' },
        ...overrides,
    };
}
function buildService(opts = {}) {
    const ownershipRow = opts.ownershipRow !== undefined ? opts.ownershipRow : { id: EXPENSE_ID };
    const expense = opts.expense !== undefined ? opts.expense : makeExpense();
    const managerMock = {
        query: jest.fn().mockResolvedValue(ownershipRow ? [ownershipRow] : []),
    };
    const expenseRepo = {
        repository: {
            manager: managerMock,
            findOne: jest.fn().mockResolvedValue(expense),
        },
    };
    return {
        service: new voucher_service_1.VoucherService(expenseRepo),
        managerMock,
        findOneMock: expenseRepo.repository.findOne,
    };
}
beforeEach(() => jest.clearAllMocks());
describe('VoucherService.generateVoucherData', () => {
    test('returns correct VoucherDataDto for Gate 3 personal-card expense', async () => {
        const { service } = buildService();
        const result = await service.generateVoucherData(EXPENSE_ID, TENANT_ID);
        expect(result.voucherNumber).toBe('PV-ABCDEF12');
        expect(result.employeeName).toBe('Nguyen Van A');
        expect(result.employeeId).toBe(EMPLOYEE_ID);
        expect(result.amountVnd.toFixed(0)).toBe('500000');
        expect(result.gateApplied).toBe(3);
        expect(result.reason).toContain('Personal card');
        expect(result.receiptImageUrl).toBe('/api/files/receipts/exp.jpg');
        expect(result.date).toEqual(new Date('2026-06-01'));
    });
    test('ownership check passes correct parameters to manager.query', async () => {
        const { service, managerMock } = buildService();
        await service.generateVoucherData(EXPENSE_ID, TENANT_ID);
        expect(managerMock.query).toHaveBeenCalledWith(expect.any(String), [EXPENSE_ID, TENANT_ID]);
    });
    test('throws NotFoundException when ownership check returns no rows', async () => {
        const { service } = buildService({ ownershipRow: null });
        await expect(service.generateVoucherData(EXPENSE_ID, TENANT_ID))
            .rejects.toThrow(common_1.NotFoundException);
    });
    test('throws NotFoundException when findOne returns null (expense not found)', async () => {
        const { service } = buildService({ expense: null });
        await expect(service.generateVoucherData(EXPENSE_ID, TENANT_ID))
            .rejects.toThrow(common_1.NotFoundException);
    });
    test('throws NotFoundException when final_category is not personal_card_reimbursement', async () => {
        const { service } = buildService({
            expense: makeExpense({ final_category: 'welfare_allowance' }),
        });
        await expect(service.generateVoucherData(EXPENSE_ID, TENANT_ID))
            .rejects.toThrow(common_1.NotFoundException);
    });
    test('falls back to "Unknown Employee" when employee relation is null', async () => {
        const { service } = buildService({
            expense: makeExpense({ employee: null }),
        });
        const result = await service.generateVoucherData(EXPENSE_ID, TENANT_ID);
        expect(result.employeeName).toBe('Unknown Employee');
    });
    test('voucherNumber uses first 8 chars of expense ID uppercased', async () => {
        const id = '12345678-aaaa-bbbb-cccc-dddddddddddd';
        const { service } = buildService({ expense: makeExpense({ id }) });
        const result = await service.generateVoucherData(id, TENANT_ID);
        expect(result.voucherNumber).toBe('PV-12345678');
    });
});
describe('VoucherService.generatePdfBuffer', () => {
    test('returns a Buffer containing the voucherNumber', async () => {
        const { service } = buildService();
        const voucherData = {
            voucherNumber: 'PV-ABCDEF12',
            date: new Date('2026-06-01'),
            employeeName: 'Nguyen Van A',
            employeeId: EMPLOYEE_ID,
            amountVnd: new decimal_js_1.Decimal('500000'),
            reason: 'Personal card reimbursement - Gate 3',
            gateApplied: 3,
            receiptImageUrl: '/api/files/receipts/exp.jpg',
        };
        const buf = await service.generatePdfBuffer(voucherData);
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.toString('utf-8')).toContain('PV-ABCDEF12');
        expect(buf.toString('utf-8')).toContain('500000');
    });
});
//# sourceMappingURL=voucher.service.spec.js.map