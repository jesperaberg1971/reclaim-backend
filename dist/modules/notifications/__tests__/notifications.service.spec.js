"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_service_1 = require("../notifications.service");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const USER = 'user-uuid-1';
const ADMIN_1 = { id: 'admin-uuid-1', email: 'admin1@firm.vn' };
const ADMIN_2 = { id: 'admin-uuid-2', email: 'admin2@firm.vn' };
const EXPENSE_ROW = { employee_name: 'Nguyen Van A', client_name: 'Cty ABC' };
function buildService(opts = {}) {
    const queryMock = jest.fn();
    const ds = { query: queryMock };
    const configMap = {};
    if (opts.resendApiKey)
        configMap['RESEND_API_KEY'] = opts.resendApiKey;
    const configService = {
        get: jest.fn((key, fallback) => configMap[key] ?? fallback ?? null),
    };
    return { service: new notifications_service_1.NotificationsService(ds, configService), queryMock };
}
describe('NotificationsService — CRUD', () => {
    test('getNotifications maps rows to AppNotification shape', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([{
                id: 'notif-1', type: 'expense_approved', title: 'T', body: 'B',
                resource_type: 'expense', resource_id: EXPENSE,
                read_at: null, created_at: new Date('2026-06-01'),
            }]);
        const list = await service.getNotifications(USER);
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe('notif-1');
        expect(list[0].created_at).toMatch(/^2026-06-01/);
        expect(list[0].read_at).toBeNull();
    });
    test('getNotifications returns empty array when no rows', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        expect(await service.getNotifications(USER)).toEqual([]);
    });
    test('getUnreadCount returns numeric count', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([{ count: '7' }]);
        expect(await service.getUnreadCount(USER)).toBe(7);
    });
    test('markRead issues UPDATE with correct WHERE clause (id AND user_id)', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await service.markRead('notif-1', USER);
        expect(queryMock).toHaveBeenCalledTimes(1);
        const [sql, params] = queryMock.mock.calls[0];
        expect(sql).toContain('user_id = $2');
        expect(params).toEqual(['notif-1', USER]);
    });
    test('markAllRead issues UPDATE scoped to userId', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await service.markAllRead(USER);
        const [sql, params] = queryMock.mock.calls[0];
        expect(sql).toContain('user_id = $1 AND read_at IS NULL');
        expect(params).toEqual([USER]);
    });
    test('getSettings returns false when no row exists', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        const settings = await service.getSettings(USER);
        expect(settings.email_enabled).toBe(false);
    });
    test('getSettings returns stored value', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([{ email_enabled: true }]);
        const settings = await service.getSettings(USER);
        expect(settings.email_enabled).toBe(true);
    });
    test('updateSettings upserts and returns new value', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        const result = await service.updateSettings(USER, true);
        expect(result.email_enabled).toBe(true);
        const [sql] = queryMock.mock.calls[0];
        expect(sql).toContain('ON CONFLICT');
    });
});
describe('NotificationsService.notifyReadyForReview', () => {
    test('returns early when no partner_admins exist', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await service.notifyReadyForReview(TENANT, EXPENSE);
        expect(queryMock).toHaveBeenCalledTimes(1);
    });
    test('returns early when expense context not found', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([ADMIN_1])
            .mockResolvedValueOnce([]);
        await service.notifyReadyForReview(TENANT, EXPENSE);
        const insertCalls = queryMock.mock.calls.filter(([s]) => s.includes('INSERT INTO notifications'));
        expect(insertCalls).toHaveLength(0);
    });
    test('creates one notification per admin', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([ADMIN_1, ADMIN_2])
            .mockResolvedValueOnce([EXPENSE_ROW])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);
        await service.notifyReadyForReview(TENANT, EXPENSE);
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO notifications'));
        expect(insertCall).toBeDefined();
        const params = insertCall[1];
        const adminIds = params.filter((_, i) => i % 6 === 0);
        expect(adminIds).toEqual([ADMIN_1.id, ADMIN_2.id]);
    });
    test('fetches notification_settings in a single batch query (not N queries)', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([ADMIN_1, ADMIN_2])
            .mockResolvedValueOnce([EXPENSE_ROW])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);
        await service.notifyReadyForReview(TENANT, EXPENSE);
        const settingsCalls = queryMock.mock.calls.filter(([s]) => s.includes('notification_settings'));
        expect(settingsCalls).toHaveLength(1);
        expect(settingsCalls[0][0]).toContain('ANY');
    });
    test('does not throw when an internal error occurs', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockRejectedValueOnce(new Error('DB down'));
        await expect(service.notifyReadyForReview(TENANT, EXPENSE)).resolves.toBeUndefined();
    });
});
describe('NotificationsService.notifyExpenseDecision', () => {
    function setupHappyPath(queryMock, emailEnabled = false) {
        queryMock
            .mockResolvedValueOnce([ADMIN_1])
            .mockResolvedValueOnce([EXPENSE_ROW])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(emailEnabled ? [{ user_id: ADMIN_1.id, email_enabled: true }] : []);
    }
    test('approved decision uses "Biên lai đã được phê duyệt" title', async () => {
        const { service, queryMock } = buildService();
        setupHappyPath(queryMock);
        await service.notifyExpenseDecision(EXPENSE, TENANT, 'approved');
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO notifications'));
        const params = insertCall[1];
        const title = params[2];
        expect(title).toContain('phê duyệt');
        const type = params[1];
        expect(type).toBe('expense_approved');
    });
    test('rejected decision uses "Biên lai đã bị từ chối" title', async () => {
        const { service, queryMock } = buildService();
        setupHappyPath(queryMock);
        await service.notifyExpenseDecision(EXPENSE, TENANT, 'rejected');
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO notifications'));
        const params = insertCall[1];
        expect(params[1]).toBe('expense_rejected');
        expect(params[2]).toContain('từ chối');
    });
    test('note is appended to body when provided', async () => {
        const { service, queryMock } = buildService();
        setupHappyPath(queryMock);
        await service.notifyExpenseDecision(EXPENSE, TENANT, 'rejected', 'Thiếu hóa đơn đỏ');
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO notifications'));
        const body = insertCall[1][3];
        expect(body).toContain('Thiếu hóa đơn đỏ');
    });
    test('email sent only to admins with email_enabled = true', async () => {
        const mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;
        const { service, queryMock } = buildService({ resendApiKey: 'test-key' });
        queryMock
            .mockResolvedValueOnce([ADMIN_1, ADMIN_2])
            .mockResolvedValueOnce([EXPENSE_ROW])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ user_id: ADMIN_1.id, email_enabled: true }]);
        await service.notifyExpenseDecision(EXPENSE, TENANT, 'approved');
        await Promise.resolve();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.to).toBe(ADMIN_1.email);
    });
    test('does not throw when an internal error occurs', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockRejectedValueOnce(new Error('timeout'));
        await expect(service.notifyExpenseDecision(EXPENSE, TENANT, 'approved')).resolves.toBeUndefined();
    });
});
//# sourceMappingURL=notifications.service.spec.js.map