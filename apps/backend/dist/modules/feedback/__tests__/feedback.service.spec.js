"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const feedback_service_1 = require("../feedback.service");
function makeService(queryImpl) {
    const ds = { query: queryImpl };
    return new feedback_service_1.FeedbackService(ds);
}
const baseRow = {
    id: 'fb-1',
    partner_id: 'p-1',
    user_id: 'u-1',
    user_role: 'partner_admin',
    type: 'bug',
    title: 'Something broke',
    body: 'Details here',
    page_url: '/expenses',
    status: 'open',
    admin_note: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
};
describe('FeedbackService', () => {
    describe('create', () => {
        it('throws BadRequestException when title is empty', async () => {
            const svc = makeService(jest.fn());
            await expect(svc.create({ type: 'bug', title: '   ' }, { partnerId: null, userId: null, userRole: null }))
                .rejects.toBeInstanceOf(common_1.BadRequestException);
        });
        it('throws BadRequestException for invalid type', async () => {
            const svc = makeService(jest.fn());
            await expect(svc.create({ type: 'invalid', title: 'Test' }, { partnerId: null, userId: null, userRole: null }))
                .rejects.toBeInstanceOf(common_1.BadRequestException);
        });
        it('inserts and returns feedback item', async () => {
            const q = jest.fn().mockResolvedValueOnce([{ ...baseRow, partner_name: null }]);
            const svc = makeService(q);
            const result = await svc.create({ type: 'bug', title: 'Something broke', body: 'Details here', page_url: '/expenses' }, { partnerId: 'p-1', userId: 'u-1', userRole: 'partner_admin' });
            expect(q).toHaveBeenCalledTimes(1);
            const [sql, params] = q.mock.calls[0];
            expect(sql).toContain('INSERT INTO feedback');
            expect(params[0]).toBe('p-1');
            expect(params[3]).toBe('bug');
            expect(result.id).toBe('fb-1');
            expect(result.type).toBe('bug');
        });
        it('stores null for optional context fields', async () => {
            const q = jest.fn().mockResolvedValueOnce([{ ...baseRow, partner_id: null, user_id: null, user_role: null }]);
            const svc = makeService(q);
            await svc.create({ type: 'question', title: 'Test' }, { partnerId: null, userId: null, userRole: null });
            const params = q.mock.calls[0][1];
            expect(params[0]).toBeNull();
            expect(params[1]).toBeNull();
            expect(params[2]).toBeNull();
        });
    });
    describe('list', () => {
        it('returns items and total without filters', async () => {
            const q = jest.fn()
                .mockResolvedValueOnce([{ total: 2 }])
                .mockResolvedValueOnce([
                { ...baseRow, partner_name: 'ACME Corp' },
                { ...baseRow, id: 'fb-2', partner_name: 'ACME Corp' },
            ]);
            const svc = makeService(q);
            const result = await svc.list({});
            expect(result.total).toBe(2);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].partner_name).toBe('ACME Corp');
        });
        it('applies status filter', async () => {
            const q = jest.fn()
                .mockResolvedValueOnce([{ total: 0 }])
                .mockResolvedValueOnce([]);
            const svc = makeService(q);
            await svc.list({ status: 'open' });
            const [countSql, countParams] = q.mock.calls[0];
            expect(countSql).toContain('f.status = $1');
            expect(countParams[0]).toBe('open');
        });
        it('applies type and partner_id filters', async () => {
            const q = jest.fn()
                .mockResolvedValueOnce([{ total: 0 }])
                .mockResolvedValueOnce([]);
            const svc = makeService(q);
            await svc.list({ type: 'bug', partner_id: 'p-1' });
            const [, params] = q.mock.calls[0];
            expect(params).toContain('bug');
            expect(params).toContain('p-1');
        });
        it('respects limit and offset', async () => {
            const q = jest.fn()
                .mockResolvedValueOnce([{ total: 100 }])
                .mockResolvedValueOnce([]);
            const svc = makeService(q);
            await svc.list({ limit: 10, offset: 20 });
            const [, params] = q.mock.calls[1];
            expect(params).toContain(10);
            expect(params).toContain(20);
        });
    });
    describe('updateStatus', () => {
        it('throws BadRequestException for invalid status', async () => {
            const svc = makeService(jest.fn());
            await expect(svc.updateStatus('fb-1', 'invalid'))
                .rejects.toBeInstanceOf(common_1.BadRequestException);
        });
        it('throws NotFoundException when row not found', async () => {
            const q = jest.fn().mockResolvedValueOnce([]);
            const svc = makeService(q);
            await expect(svc.updateStatus('missing-id', 'resolved'))
                .rejects.toBeInstanceOf(common_1.NotFoundException);
        });
        it('updates status and returns item', async () => {
            const updated = { ...baseRow, status: 'acknowledged', admin_note: 'Looking into it' };
            const q = jest.fn()
                .mockResolvedValueOnce([updated])
                .mockResolvedValueOnce([{ name: 'ACME' }]);
            const svc = makeService(q);
            const result = await svc.updateStatus('fb-1', 'acknowledged', 'Looking into it');
            const [sql, params] = q.mock.calls[0];
            expect(sql).toContain('UPDATE feedback');
            expect(params[0]).toBe('acknowledged');
            expect(result.status).toBe('acknowledged');
            expect(result.partner_name).toBe('ACME');
        });
        it('updates status only (no admin_note arg)', async () => {
            const q = jest.fn()
                .mockResolvedValueOnce([{ ...baseRow, status: 'resolved', partner_id: null }]);
            const svc = makeService(q);
            const result = await svc.updateStatus('fb-1', 'resolved');
            const [, params] = q.mock.calls[0];
            expect(params).toHaveLength(2);
            expect(result.status).toBe('resolved');
        });
    });
    describe('getPilotSummary', () => {
        it('returns empty array when no partnerIds', async () => {
            const svc = makeService(jest.fn());
            const result = await svc.getPilotSummary([]);
            expect(result).toEqual([]);
        });
        it('queries with correct IN placeholders', async () => {
            const summaryRow = {
                partner_id: 'p-1',
                partner_name: 'ACME',
                is_active: true,
                client_count: 3,
                active_employees: 10,
                total_expenses: 50,
                expenses_in_period: 12,
                pending_expenses: 2,
                approved_expenses: 45,
                total_amount_vnd: '1000000',
                last_activity: new Date().toISOString(),
                subscription_status: 'active',
                open_feedback: 1,
            };
            const q = jest.fn().mockResolvedValueOnce([summaryRow]);
            const svc = makeService(q);
            const result = await svc.getPilotSummary(['p-1', 'p-2']);
            const [sql, params] = q.mock.calls[0];
            expect(sql).toContain('$3');
            expect(sql).toContain('$4');
            expect(params[2]).toBe('p-1');
            expect(params[3]).toBe('p-2');
            expect(result[0].partner_id).toBe('p-1');
            expect(result[0].open_feedback).toBe(1);
        });
        it('uses provided date range', async () => {
            const q = jest.fn().mockResolvedValueOnce([]);
            const svc = makeService(q);
            await svc.getPilotSummary(['p-1'], '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z');
            const [, params] = q.mock.calls[0];
            expect(params[0]).toBe('2026-01-01T00:00:00Z');
            expect(params[1]).toBe('2026-12-31T23:59:59Z');
        });
    });
});
//# sourceMappingURL=feedback.service.spec.js.map