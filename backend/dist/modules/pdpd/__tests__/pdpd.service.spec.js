"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const pdpd_service_1 = require("../pdpd.service");
const PARTNER_A = 'aaa-partner-id';
const PARTNER_B = 'bbb-partner-id';
const EMP_ID = 'emp-uuid-1234';
function makeService(queryImpl) {
    const ds = { query: queryImpl };
    return new pdpd_service_1.PdpdService(ds);
}
describe('PdpdService.exportEmployeeData', () => {
    const baseEmp = {
        id: EMP_ID, employee_id: 'EMP001', full_name: 'Nguyễn A',
        client_id: 'c-1', client_name: 'ACME', partner_id: PARTNER_A,
        is_active: true, pdpd_consent: true,
    };
    it('throws NotFoundException when employee does not exist', async () => {
        const q = jest.fn().mockResolvedValueOnce([]);
        const svc = makeService(q);
        await expect(svc.exportEmployeeData(EMP_ID, PARTNER_A, 'u-1', 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('throws ForbiddenException when partner_admin accesses another tenant', async () => {
        const q = jest.fn().mockResolvedValueOnce([{ ...baseEmp, partner_id: PARTNER_A }]);
        const svc = makeService(q);
        await expect(svc.exportEmployeeData(EMP_ID, PARTNER_B, 'u-1', 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('super_admin can access any tenant', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([baseEmp])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(undefined);
        const svc = makeService(q);
        const result = await svc.exportEmployeeData(EMP_ID, null, 'admin-id', 'super_admin');
        expect(result.employee.id).toBe(EMP_ID);
        expect(result.employee.full_name).toBe('Nguyễn A');
        expect(result.exported_at).toBeTruthy();
    });
    it('returns all personal data sections', async () => {
        const bankRow = { id: 'b-1', bank_name: 'VCB', account_number_last4: '1234', is_primary: true };
        const expRow = { id: 'e-1', receipt_date: null, final_category: 'meal', original_amount: '150000', status: 'approved', created_at: new Date() };
        const attRow = { id: 'a-1', latitude: 10.1, longitude: 106.2, created_at: new Date() };
        const logRow = { id: 'l-1', employee_id: EMP_ID, event: 'consent_given', performed_by_user_id: null, performed_by_role: null, ip_address: null, metadata: {}, created_at: new Date() };
        const q = jest.fn()
            .mockResolvedValueOnce([baseEmp])
            .mockResolvedValueOnce([bankRow])
            .mockResolvedValueOnce([expRow])
            .mockResolvedValueOnce([attRow])
            .mockResolvedValueOnce([logRow])
            .mockResolvedValueOnce(undefined);
        const svc = makeService(q);
        const result = await svc.exportEmployeeData(EMP_ID, PARTNER_A, 'u-1', 'partner_admin');
        expect(result.bank_accounts).toHaveLength(1);
        expect(result.bank_accounts[0].bank_name).toBe('VCB');
        expect(result.expenses).toHaveLength(1);
        expect(result.attendance).toHaveLength(1);
        expect(result.consent_log).toHaveLength(1);
        expect(result.consent_log[0].event).toBe('consent_given');
    });
    it('logs a data_exported event after successful export', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([baseEmp])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(undefined);
        const svc = makeService(q);
        await svc.exportEmployeeData(EMP_ID, PARTNER_A, 'u-1', 'partner_admin', '1.2.3.4');
        const lastCall = q.mock.calls[q.mock.calls.length - 1];
        expect(lastCall[0]).toContain('INSERT INTO pdpd_consent_log');
        expect(lastCall[1]).toContain('data_exported');
    });
});
describe('PdpdService.withdrawConsent', () => {
    const baseEmp = { id: EMP_ID, pdpd_consent: true, partner_id: PARTNER_A };
    it('throws NotFoundException for missing employee', async () => {
        const q = jest.fn().mockResolvedValueOnce([]);
        await expect(makeService(q).withdrawConsent(EMP_ID, PARTNER_A, 'u-1', 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('throws ForbiddenException for cross-tenant access', async () => {
        const q = jest.fn().mockResolvedValueOnce([baseEmp]);
        await expect(makeService(q).withdrawConsent(EMP_ID, PARTNER_B, 'u-1', 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('anonymizes employee PII and deletes bank accounts', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([baseEmp])
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined);
        const svc = makeService(q);
        const result = await svc.withdrawConsent(EMP_ID, PARTNER_A, 'u-1', 'partner_admin');
        expect(result.anonymized).toBe(true);
        expect(result.employee_id).toMatch(/^ANON-/);
        const updateCall = q.mock.calls[1];
        expect(updateCall[0]).toContain('UPDATE employees');
        expect(updateCall[0]).toContain('pdpd_consent = FALSE');
        expect(updateCall[1]).toContain('Ẩn danh');
        const deleteCall = q.mock.calls[2];
        expect(deleteCall[0]).toContain('DELETE FROM employee_bank_accounts');
    });
    it('logs a data_anonymized event', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([baseEmp])
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined);
        await makeService(q).withdrawConsent(EMP_ID, PARTNER_A, 'u-1', 'partner_admin', '10.0.0.1');
        const lastCall = q.mock.calls[q.mock.calls.length - 1];
        expect(lastCall[0]).toContain('INSERT INTO pdpd_consent_log');
        expect(lastCall[1]).toContain('data_anonymized');
    });
});
describe('PdpdService.recordConsentGiven', () => {
    it('throws NotFoundException for missing employee', async () => {
        const q = jest.fn().mockResolvedValueOnce([]);
        await expect(makeService(q).recordConsentGiven(EMP_ID, PARTNER_A, 'u-1', 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('sets pdpd_consent = TRUE and logs event', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([{ id: EMP_ID, partner_id: PARTNER_A }])
            .mockResolvedValueOnce(undefined)
            .mockResolvedValueOnce(undefined);
        const result = await makeService(q).recordConsentGiven(EMP_ID, PARTNER_A, 'u-1', 'partner_admin');
        expect(result.pdpd_consent).toBe(true);
        const updateCall = q.mock.calls[1];
        expect(updateCall[0]).toContain('UPDATE employees SET pdpd_consent = TRUE');
        const logCall = q.mock.calls[2];
        expect(logCall[1]).toContain('consent_given');
    });
});
describe('PdpdService.getConsentLog', () => {
    it('throws NotFoundException for missing employee', async () => {
        const q = jest.fn().mockResolvedValueOnce([]);
        await expect(makeService(q).getConsentLog(EMP_ID, PARTNER_A, 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('throws ForbiddenException for cross-tenant access', async () => {
        const q = jest.fn().mockResolvedValueOnce([{ id: EMP_ID, partner_id: PARTNER_A }]);
        await expect(makeService(q).getConsentLog(EMP_ID, PARTNER_B, 'partner_admin'))
            .rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    it('returns mapped log rows', async () => {
        const logRow = {
            id: 'l-1', employee_id: EMP_ID, event: 'consent_given',
            performed_by_user_id: 'u-1', performed_by_role: 'partner_admin',
            ip_address: '10.0.0.1', metadata: { note: 'initial' }, created_at: new Date(),
        };
        const q = jest.fn()
            .mockResolvedValueOnce([{ id: EMP_ID, partner_id: PARTNER_A }])
            .mockResolvedValueOnce([logRow]);
        const result = await makeService(q).getConsentLog(EMP_ID, PARTNER_A, 'partner_admin');
        expect(result).toHaveLength(1);
        expect(result[0].event).toBe('consent_given');
        expect(result[0].metadata).toEqual({ note: 'initial' });
    });
    it('super_admin can access any tenant', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([{ id: EMP_ID, partner_id: PARTNER_A }])
            .mockResolvedValueOnce([]);
        const result = await makeService(q).getConsentLog(EMP_ID, null, 'super_admin');
        expect(result).toEqual([]);
    });
});
//# sourceMappingURL=pdpd.service.spec.js.map