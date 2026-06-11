"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../auth/auth.service");
function buildAuthService(queryImpl) {
    const queryMock = jest.fn().mockImplementation(queryImpl);
    const mockUserRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };
    const mockJwt = { sign: jest.fn().mockReturnValue('token') };
    const mockConfig = { get: jest.fn().mockReturnValue('secret') };
    const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
    const mockDs = { query: queryMock };
    const mockRedis = { cacheGet: jest.fn(), cacheSet: jest.fn().mockResolvedValue(undefined), cacheDelete: jest.fn() };
    const service = new auth_service_1.AuthService(mockUserRepo, mockJwt, mockConfig, mockAudit, mockDs, mockRedis);
    return { service, queryMock, mockUserRepo, mockAudit };
}
beforeEach(() => jest.clearAllMocks());
describe('AuthService.forgotPassword', () => {
    test('returns empty token for unknown email without throwing', async () => {
        const { service, mockUserRepo } = buildAuthService(() => Promise.resolve([]));
        mockUserRepo.findOne.mockResolvedValue(null);
        const result = await service.forgotPassword('nobody@example.com');
        expect(result.token).toBe('');
    });
    test('returns 64-char hex token for known user', async () => {
        const { service, mockUserRepo } = buildAuthService(() => Promise.resolve([]));
        mockUserRepo.findOne.mockResolvedValue({ id: 'user-1', email: 'u@e.com' });
        const result = await service.forgotPassword('u@e.com');
        expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    });
    test('stores token in password_reset_tokens table', async () => {
        let insertCalled = false;
        const { service, mockUserRepo } = buildAuthService((sql) => {
            if (sql.includes('INSERT INTO password_reset_tokens'))
                insertCalled = true;
            return Promise.resolve([]);
        });
        mockUserRepo.findOne.mockResolvedValue({ id: 'user-1' });
        await service.forgotPassword('u@e.com');
        expect(insertCalled).toBe(true);
    });
    test('deletes existing tokens before inserting new one', async () => {
        let deleteCalled = false;
        const { service, mockUserRepo } = buildAuthService((sql) => {
            if (sql.includes('DELETE FROM password_reset_tokens'))
                deleteCalled = true;
            return Promise.resolve([]);
        });
        mockUserRepo.findOne.mockResolvedValue({ id: 'user-1' });
        await service.forgotPassword('u@e.com');
        expect(deleteCalled).toBe(true);
    });
});
describe('AuthService.resetPassword', () => {
    test('throws BadRequestException for unknown token', async () => {
        const { service } = buildAuthService(() => Promise.resolve([]));
        await expect(service.resetPassword('badtoken', 'newpass')).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws BadRequestException for expired token', async () => {
        const expired = new Date(Date.now() - 1000).toISOString();
        const { service } = buildAuthService((sql) => {
            if (sql.includes('FROM password_reset_tokens'))
                return Promise.resolve([{ user_id: 'user-1', expires_at: expired }]);
            return Promise.resolve([]);
        });
        await expect(service.resetPassword('expiredtoken', 'newpass')).rejects.toThrow(common_1.BadRequestException);
    });
    test('updates password_hash on valid token', async () => {
        let updateCalled = false;
        const future = new Date(Date.now() + 3_600_000).toISOString();
        const { service } = buildAuthService((sql) => {
            if (sql.includes('FROM password_reset_tokens'))
                return Promise.resolve([{ user_id: 'user-1', expires_at: future }]);
            if (sql.includes('UPDATE users SET password_hash')) {
                updateCalled = true;
                return Promise.resolve([]);
            }
            return Promise.resolve([]);
        });
        await service.resetPassword('validtoken', 'newSecurePass');
        expect(updateCalled).toBe(true);
    });
    test('deletes token after successful reset', async () => {
        let deleteCalled = false;
        const future = new Date(Date.now() + 3_600_000).toISOString();
        const { service } = buildAuthService((sql) => {
            if (sql.includes('DELETE')) {
                deleteCalled = true;
                return Promise.resolve([]);
            }
            if (sql.includes('FROM password_reset_tokens'))
                return Promise.resolve([{ user_id: 'user-1', expires_at: future }]);
            return Promise.resolve([]);
        });
        await service.resetPassword('validtoken', 'newSecurePass');
        expect(deleteCalled).toBe(true);
    });
});
//# sourceMappingURL=auth-password-reset.spec.js.map