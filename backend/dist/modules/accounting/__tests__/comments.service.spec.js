"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const comments_service_1 = require("../comments.service");
const TENANT = 'tenant-uuid-1';
const EXPENSE = 'expense-uuid-1';
const USER = 'user-uuid-1';
const CLIENT = 'client-uuid-1';
function makeCommentRow(overrides = {}) {
    return {
        id: 'comment-uuid-1',
        expense_id: EXPENSE,
        user_id: USER,
        user_email: 'a@b.com',
        user_role: 'partner_admin',
        body: 'Looks good',
        created_at: new Date('2026-06-01'),
        ...overrides,
    };
}
function buildService() {
    const queryMock = jest.fn();
    const ds = { query: queryMock };
    return { service: new comments_service_1.CommentsService(ds), queryMock };
}
describe('CommentsService.getComments', () => {
    test('returns mapped comments without clientId filter', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([makeCommentRow()]);
        const result = await service.getComments(EXPENSE, TENANT);
        expect(result).toHaveLength(1);
        expect(result[0].body).toBe('Looks good');
        expect(result[0].created_at).toMatch(/^2026-06-01/);
    });
    test('returns empty array when no rows', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        expect(await service.getComments(EXPENSE, TENANT)).toEqual([]);
    });
    test('clientId filter is passed as a parameter, not string-interpolated', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await service.getComments(EXPENSE, TENANT, CLIENT);
        const [sql, params] = queryMock.mock.calls[0];
        expect(sql).not.toContain(CLIENT);
        expect(params).toContain(CLIENT);
    });
    test('no clientId filter adds no extra param', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await service.getComments(EXPENSE, TENANT);
        const [, params] = queryMock.mock.calls[0];
        expect(params).toEqual([EXPENSE, TENANT]);
    });
});
describe('CommentsService.addComment', () => {
    test('throws BadRequestException for empty body', async () => {
        const { service } = buildService();
        await expect(service.addComment(EXPENSE, USER, '', TENANT)).rejects.toThrow(common_1.BadRequestException);
        await expect(service.addComment(EXPENSE, USER, '   ', TENANT)).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws BadRequestException for body exceeding 2000 characters', async () => {
        const { service } = buildService();
        const longBody = 'x'.repeat(2001);
        await expect(service.addComment(EXPENSE, USER, longBody, TENANT)).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws NotFoundException when expense not found', async () => {
        const { service, queryMock } = buildService();
        queryMock.mockResolvedValueOnce([]);
        await expect(service.addComment(EXPENSE, USER, 'ok', TENANT)).rejects.toThrow(common_1.NotFoundException);
    });
    test('happy path: returns comment from CTE join (single INSERT query)', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([{ id: EXPENSE }])
            .mockResolvedValueOnce([makeCommentRow()]);
        const result = await service.addComment(EXPENSE, USER, 'Looks good', TENANT);
        expect(result.body).toBe('Looks good');
        expect(result.user_email).toBe('a@b.com');
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO expense_comments'));
        expect(insertCall).toBeDefined();
        expect(insertCall[0]).toContain('WITH inserted');
        expect(insertCall[0]).toContain('JOIN users');
        expect(queryMock).toHaveBeenCalledTimes(2);
    });
    test('trims whitespace before storing', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([{ id: EXPENSE }])
            .mockResolvedValueOnce([makeCommentRow({ body: 'trimmed' })]);
        await service.addComment(EXPENSE, USER, '  trimmed  ', TENANT);
        const insertCall = queryMock.mock.calls.find(([s]) => s.includes('INSERT INTO expense_comments'));
        const params = insertCall[1];
        expect(params[2]).toBe('trimmed');
    });
    test('clientId is passed as a parameter for ownership verification', async () => {
        const { service, queryMock } = buildService();
        queryMock
            .mockResolvedValueOnce([{ id: EXPENSE }])
            .mockResolvedValueOnce([makeCommentRow()]);
        await service.addComment(EXPENSE, USER, 'hi', TENANT, CLIENT);
        const ownershipCall = queryMock.mock.calls[0];
        expect(ownershipCall[0]).not.toContain(CLIENT);
        expect(ownershipCall[1]).toContain(CLIENT);
    });
});
describe('CommentsService.getCommentsByExpenseIds', () => {
    test('returns empty map and skips query for empty input', async () => {
        const { service, queryMock } = buildService();
        const result = await service.getCommentsByExpenseIds([], TENANT);
        expect(result.size).toBe(0);
        expect(queryMock).not.toHaveBeenCalled();
    });
    test('groups comments by expense_id', async () => {
        const { service, queryMock } = buildService();
        const EXP_2 = 'expense-uuid-2';
        queryMock.mockResolvedValueOnce([
            makeCommentRow({ expense_id: EXPENSE, id: 'c-1' }),
            makeCommentRow({ expense_id: EXPENSE, id: 'c-2' }),
            makeCommentRow({ expense_id: EXP_2, id: 'c-3' }),
        ]);
        const result = await service.getCommentsByExpenseIds([EXPENSE, EXP_2], TENANT);
        expect(result.get(EXPENSE)).toHaveLength(2);
        expect(result.get(EXP_2)).toHaveLength(1);
    });
});
//# sourceMappingURL=comments.service.spec.js.map