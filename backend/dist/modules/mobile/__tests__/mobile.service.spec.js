"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const mobile_service_1 = require("../mobile.service");
const expense_entity_1 = require("../../../database/entities/expense.entity");
jest.mock('../../../common/storage/receipt-image.util', () => ({
    saveReceiptImage: jest.fn().mockResolvedValue('/api/files/receipts/test-id.jpg'),
    mimeToExt: jest.fn().mockReturnValue('jpg'),
}));
const receipt_image_util_1 = require("../../../common/storage/receipt-image.util");
const TENANT_ID = 'tenant-uuid-1';
const CLIENT_ID = 'client-uuid-1';
const EMPLOYEE_ID = 'employee-uuid-1';
const EXPENSE_ID = 'new-expense-uuid';
function makeFile(overrides = {}) {
    return {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'receipt.jpg',
        fieldname: 'image',
        encoding: '7bit',
        destination: '', filename: '', path: '',
        stream: null,
        ...overrides,
    };
}
function makeUser(overrides = {}) {
    return {
        sub: 'u-1', userId: 'u-1', tenantId: TENANT_ID,
        role: 'employee',
        clientId: CLIENT_ID, employeeId: EMPLOYEE_ID,
        ...overrides,
    };
}
function buildService() {
    let savedStub = null;
    const mockRepo = {
        repository: {
            create: jest.fn().mockImplementation((data) => { savedStub = { ...data }; return savedStub; }),
            save: jest.fn().mockImplementation((e) => { e.id = e.id ?? EXPENSE_ID; return Promise.resolve(e); }),
            findOne: jest.fn(),
            manager: { query: jest.fn().mockResolvedValue([{ id: 1 }]) },
        },
    };
    const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'bull-job-1' }) };
    const mockRedis = {
        setTempImage: jest.fn().mockResolvedValue(undefined),
        getTempImage: jest.fn().mockResolvedValue(null),
        deleteTempImage: jest.fn().mockResolvedValue(undefined),
        recordOcrOutcome: jest.fn(),
        cacheGet: jest.fn().mockResolvedValue(null),
        cacheSet: jest.fn().mockResolvedValue(undefined),
    };
    const service = new mobile_service_1.MobileService(mockQueue, mockRepo, mockRedis);
    return { service, mockRepo, mockQueue, mockRedis, getSaved: () => savedStub };
}
beforeEach(() => {
    jest.clearAllMocks();
    receipt_image_util_1.saveReceiptImage.mockResolvedValue('/api/files/receipts/test-id.jpg');
});
describe('MobileService.enqueueReceiptUpload — success', () => {
    test('returns receipt_image_url in response', async () => {
        const { service } = buildService();
        const result = await service.enqueueReceiptUpload(makeFile(), makeUser());
        expect(result.receipt_image_url).toBe('/api/files/receipts/test-id.jpg');
        expect(result.expenseId).toBeDefined();
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.PENDING_OCR);
    });
    test('creates expense stub with receipt_image_url set', async () => {
        const { service, mockRepo } = buildService();
        await service.enqueueReceiptUpload(makeFile(), makeUser());
        const createArg = mockRepo.repository.create.mock.calls[0][0];
        expect(createArg.receipt_image_url).toBe('/api/files/receipts/test-id.jpg');
    });
    test('adds receipt_image entry to supporting_documents', async () => {
        const { service, mockRepo } = buildService();
        await service.enqueueReceiptUpload(makeFile(), makeUser());
        const createArg = mockRepo.repository.create.mock.calls[0][0];
        expect(createArg.supporting_documents).toHaveLength(1);
        expect(createArg.supporting_documents[0].type).toBe('receipt_image');
        expect(createArg.supporting_documents[0].url).toBe('/api/files/receipts/test-id.jpg');
        expect(typeof createArg.supporting_documents[0].generated_at).toBe('string');
    });
    test('supporting_document filename contains expenseId and extension', async () => {
        const { service, mockRepo } = buildService();
        await service.enqueueReceiptUpload(makeFile(), makeUser());
        const doc = mockRepo.repository.create.mock.calls[0][0].supporting_documents[0];
        expect(doc.filename).toMatch(/\.jpg$/);
    });
    test('enqueues OCR job with the pre-generated expenseId as jobId', async () => {
        const { service, mockQueue, mockRepo } = buildService();
        await service.enqueueReceiptUpload(makeFile(), makeUser());
        const createArg = mockRepo.repository.create.mock.calls[0][0];
        const preGenId = createArg.id;
        expect(preGenId).toBeDefined();
        const queueCall = mockQueue.add.mock.calls[0];
        expect(queueCall[1].expenseId).toBe(preGenId);
        expect(queueCall[2].jobId).toBe(preGenId);
    });
    test('saves image to Redis as base64', async () => {
        const { service, mockRedis } = buildService();
        const file = makeFile({ buffer: Buffer.from('img-data') });
        await service.enqueueReceiptUpload(file, makeUser());
        expect(mockRedis.setTempImage).toHaveBeenCalledWith(expect.stringContaining('receipt:temp:'), Buffer.from('img-data').toString('base64'));
    });
});
describe('MobileService.enqueueReceiptUpload — validation', () => {
    test('throws if user has no clientId', async () => {
        const { service } = buildService();
        await expect(service.enqueueReceiptUpload(makeFile(), makeUser({ clientId: undefined }))).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws if no employeeId can be resolved', async () => {
        const { service } = buildService();
        await expect(service.enqueueReceiptUpload(makeFile(), makeUser({ employeeId: undefined }))).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws on unsupported MIME type', async () => {
        const { service } = buildService();
        await expect(service.enqueueReceiptUpload(makeFile({ mimetype: 'image/gif' }), makeUser())).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws when file exceeds 20 MB', async () => {
        const { service } = buildService();
        await expect(service.enqueueReceiptUpload(makeFile({ size: 21 * 1024 * 1024 }), makeUser())).rejects.toThrow(common_1.BadRequestException);
    });
});
describe('MobileService.enqueueReceiptUpload — disk save failure', () => {
    test('propagates disk write error before creating expense or enqueueing OCR', async () => {
        receipt_image_util_1.saveReceiptImage.mockRejectedValueOnce(new Error('ENOSPC: no space left on device'));
        const { service, mockRepo, mockQueue } = buildService();
        await expect(service.enqueueReceiptUpload(makeFile(), makeUser())).rejects.toThrow('ENOSPC');
        expect(mockRepo.repository.create).not.toHaveBeenCalled();
        expect(mockQueue.add).not.toHaveBeenCalled();
    });
});
describe('MobileService.getExpenseList', () => {
    const EXPENSE_ROW = {
        id: 'exp-1', status: 'approved', gate_applied: 1,
        final_category: 'travel_allowance',
        original_amount: '500000', final_amount_deductible: '500000',
        currency: 'VND',
        receipt_date: new Date('2026-05-01'),
        receipt_image_url: '/api/files/receipts/exp-1.jpg',
        supporting_documents: [{ type: 'receipt_image', url: '/api/files/receipts/exp-1.jpg', generated_at: '2026-05-01T00:00:00.000Z' }],
        pit_flag: false,
        created_at: new Date('2026-05-01T10:00:00.000Z'),
        vendor: 'Grab',
    };
    function buildListService(rows, total = rows.length) {
        const { service, mockRepo } = buildService();
        let queryCall = 0;
        mockRepo.repository.manager.query = jest.fn().mockImplementation((sql) => {
            if (sql.includes('COUNT(*)'))
                return Promise.resolve([{ total: String(total) }]);
            queryCall++;
            return Promise.resolve(rows);
        });
        return { service, queryMock: mockRepo.repository.manager.query };
    }
    test('returns expenses with correct shape', async () => {
        const { service } = buildListService([EXPENSE_ROW]);
        const user = makeUser({ role: 'employee' });
        const result = await service.getExpenseList(user, {});
        expect(result.expenses).toHaveLength(1);
        expect(result.expenses[0].id).toBe('exp-1');
        expect(result.expenses[0].vendor).toBe('Grab');
        expect(result.expenses[0].receipt_image_url).toBe('/api/files/receipts/exp-1.jpg');
        expect(result.expenses[0].supporting_documents).toHaveLength(1);
    });
    test('returns total, limit, offset, sync_token', async () => {
        const { service } = buildListService([EXPENSE_ROW], 5);
        const result = await service.getExpenseList(makeUser(), { limit: 10 });
        expect(result.total).toBe(5);
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
        expect(result.sync_token).toBe(new Date('2026-05-01T10:00:00.000Z').toISOString());
    });
    test('sync_token is null when no expenses returned', async () => {
        const { service } = buildListService([]);
        const result = await service.getExpenseList(makeUser(), {});
        expect(result.sync_token).toBeNull();
    });
    test('employee role without explicit employeeId query param: scoped by client_id', async () => {
        const { service, queryMock } = buildListService([]);
        const user = makeUser({ role: 'employee' });
        await service.getExpenseList(user, {});
        const mainQuery = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[0];
        expect(mainQuery).toContain('e.client_id');
        const mainParams = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[1];
        expect(mainParams).toContain(CLIENT_ID);
        expect(mainParams).not.toContain(EMPLOYEE_ID);
    });
    test('employee role with explicit employeeId query param: scoped by both employee_id and client_id', async () => {
        const { service, queryMock } = buildListService([]);
        const user = makeUser({ role: 'employee' });
        await service.getExpenseList(user, { employeeId: EMPLOYEE_ID });
        const mainQuery = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[0];
        expect(mainQuery).toContain('e.employee_id');
        const mainParams = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[1];
        expect(mainParams).toContain(EMPLOYEE_ID);
        expect(mainParams).toContain(CLIENT_ID);
    });
    test('partner_admin without employeeId filter: no employee_id clause', async () => {
        const { service, queryMock } = buildListService([]);
        const adminUser = { ...makeUser(), role: 'partner_admin', employeeId: undefined };
        await service.getExpenseList(adminUser, {});
        const mainQuery = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[0];
        const mainParams = queryMock.mock.calls.find(([sql]) => sql.includes('ORDER BY'))?.[1] ?? [];
        expect(mainParams).not.toContain(EMPLOYEE_ID);
    });
    test('since filter is added to query params', async () => {
        const { service, queryMock } = buildListService([]);
        await service.getExpenseList(makeUser(), { since: '2026-04-01T00:00:00.000Z' });
        const allParams = queryMock.mock.calls.flatMap(([_sql, p]) => p ?? []);
        expect(allParams).toContain('2026-04-01T00:00:00.000Z');
    });
    test('status filter splits comma-separated list into array', async () => {
        const { service, queryMock } = buildListService([]);
        await service.getExpenseList(makeUser({ role: 'partner_admin' }), {
            status: 'pending_ocr,needs_review',
        });
        const allParams = queryMock.mock.calls.flatMap(([_sql, p]) => p ?? []);
        const statusParam = allParams.find((p) => Array.isArray(p));
        expect(statusParam).toEqual(['pending_ocr', 'needs_review']);
    });
    test('limit is capped at 100', async () => {
        const { service } = buildListService([]);
        const result = await service.getExpenseList(makeUser(), { limit: 999 });
        expect(result.limit).toBe(100);
    });
    test('supporting_documents defaults to [] when null in DB', async () => {
        const rowWithNullDocs = { ...EXPENSE_ROW, supporting_documents: null };
        const { service } = buildListService([rowWithNullDocs]);
        const result = await service.getExpenseList(makeUser(), {});
        expect(result.expenses[0].supporting_documents).toEqual([]);
    });
    test('admin can filter by specific employeeId', async () => {
        const { service, queryMock } = buildListService([]);
        const adminUser = { ...makeUser(), role: 'partner_admin', employeeId: undefined };
        await service.getExpenseList(adminUser, { employeeId: 'other-emp-id' });
        const allParams = queryMock.mock.calls.flatMap(([_sql, p]) => p ?? []);
        expect(allParams).toContain('other-emp-id');
    });
});
describe('MobileService.batchUploadReceipts', () => {
    test('returns one result per file', async () => {
        const { service } = buildService();
        const files = [makeFile(), makeFile()];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.total).toBe(2);
        expect(res.results).toHaveLength(2);
    });
    test('succeeded/failed counts reflect per-file outcomes', async () => {
        const { service } = buildService();
        const files = [makeFile(), makeFile({ mimetype: 'image/gif' })];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.succeeded).toBe(1);
        expect(res.failed).toBe(1);
    });
    test('failed item has error field set', async () => {
        const { service } = buildService();
        const files = [makeFile({ mimetype: 'image/gif' }), makeFile()];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.results[0].error).toBeDefined();
        expect(res.results[1].error).toBeUndefined();
    });
    test('result index matches file position', async () => {
        const { service } = buildService();
        const files = [makeFile(), makeFile(), makeFile()];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.results[0].index).toBe(0);
        expect(res.results[1].index).toBe(1);
        expect(res.results[2].index).toBe(2);
    });
    test('each successful result includes receipt_image_url', async () => {
        const { service } = buildService();
        const res = await service.batchUploadReceipts([makeFile()], makeUser());
        expect(res.results[0].receipt_image_url).toBe('/api/files/receipts/test-id.jpg');
    });
    test('idempotency key[0] applied to file[0], key[1] to file[1]', async () => {
        const { service, mockRedis } = buildService();
        const files = [makeFile(), makeFile()];
        const keys = ['key-for-0', 'key-for-1'];
        await service.batchUploadReceipts(files, makeUser(), undefined, keys);
        const setCalls = mockRedis.cacheSet.mock.calls;
        expect(setCalls[0][0]).toContain('key-for-0');
        expect(setCalls[1][0]).toContain('key-for-1');
    });
    test('missing idempotency key for some files is handled gracefully', async () => {
        const { service, mockRedis } = buildService();
        const files = [makeFile(), makeFile()];
        await service.batchUploadReceipts(files, makeUser(), undefined, ['only-key-0']);
        const setCalls = mockRedis.cacheSet.mock.calls;
        expect(setCalls).toHaveLength(1);
        expect(setCalls[0][0]).toContain('only-key-0');
    });
    test('one file failure does not abort remaining files', async () => {
        const { service } = buildService();
        const files = [makeFile({ mimetype: 'image/gif' }), makeFile(), makeFile()];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.succeeded).toBe(2);
        expect(res.failed).toBe(1);
        expect(res.results[1].expenseId).toBeDefined();
        expect(res.results[2].expenseId).toBeDefined();
    });
    test('all files fail → succeeded=0, failed=total', async () => {
        const { service } = buildService();
        const files = [makeFile({ mimetype: 'video/mp4' }), makeFile({ mimetype: 'audio/mp3' })];
        const res = await service.batchUploadReceipts(files, makeUser());
        expect(res.succeeded).toBe(0);
        expect(res.failed).toBe(2);
        expect(res.total).toBe(2);
    });
});
describe('MobileService — idempotency key', () => {
    const IDEM_KEY = 'client-retry-uuid-abc';
    const CACHED_RESULT = JSON.stringify({
        expenseId: 'cached-expense-id',
        status: 'pending_ocr',
        user_message: 'Your receipt is in the processing queue.',
        receipt_image_url: '/api/files/receipts/cached-expense-id.jpg',
    });
    test('cache hit: returns cached result without creating a new expense', async () => {
        const { service, mockRepo, mockQueue, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(CACHED_RESULT);
        const result = await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, IDEM_KEY);
        expect(result.expenseId).toBe('cached-expense-id');
        expect(mockRepo.repository.create).not.toHaveBeenCalled();
        expect(mockQueue.add).not.toHaveBeenCalled();
    });
    test('cache hit: does NOT call saveReceiptImage on duplicate', async () => {
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(CACHED_RESULT);
        await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, IDEM_KEY);
        expect(receipt_image_util_1.saveReceiptImage).not.toHaveBeenCalled();
    });
    test('cache miss: creates expense and stores result in cache', async () => {
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(null);
        mockRedis.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, IDEM_KEY);
        expect(mockRedis.cacheSet).toHaveBeenCalledWith(expect.stringContaining(`mobile:idem:${makeUser().userId}:${IDEM_KEY}`), expect.stringContaining('"status":"pending_ocr"'), 86_400);
    });
    test('cache miss: stored value includes receipt_image_url', async () => {
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(null);
        mockRedis.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, IDEM_KEY);
        const storedJson = JSON.parse(mockRedis.cacheSet.mock.calls[0][1]);
        expect(storedJson.receipt_image_url).toBe('/api/files/receipts/test-id.jpg');
        expect(storedJson.expenseId).toBeDefined();
    });
    test('cache key is scoped by userId to prevent cross-user collisions', async () => {
        const { service, mockRedis: redis1 } = buildService();
        redis1.cacheGet = jest.fn().mockResolvedValue(null);
        redis1.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser({ userId: 'user-A' }), undefined, 'same-key');
        const keyA = redis1.cacheSet.mock.calls[0][0];
        const { service: service2, mockRedis: redis2 } = buildService();
        redis2.cacheGet = jest.fn().mockResolvedValue(null);
        redis2.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service2.enqueueReceiptUpload(makeFile(), makeUser({ userId: 'user-B' }), undefined, 'same-key');
        const keyB = redis2.cacheSet.mock.calls[0][0];
        expect(keyA).not.toBe(keyB);
        expect(keyA).toContain('user-A');
        expect(keyB).toContain('user-B');
    });
    test('no idempotency_key: cacheGet and cacheSet are never called', async () => {
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(null);
        mockRedis.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser());
        expect(mockRedis.cacheGet).not.toHaveBeenCalled();
        expect(mockRedis.cacheSet).not.toHaveBeenCalled();
    });
    test('empty string idempotency_key is treated as absent', async () => {
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(null);
        mockRedis.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, '   ');
        expect(mockRedis.cacheGet).not.toHaveBeenCalled();
        expect(mockRedis.cacheSet).not.toHaveBeenCalled();
    });
    test('key longer than 128 chars is accepted but truncated in the Redis key', async () => {
        const longKey = 'a'.repeat(200);
        const { service, mockRedis } = buildService();
        mockRedis.cacheGet = jest.fn().mockResolvedValue(null);
        mockRedis.cacheSet = jest.fn().mockResolvedValue(undefined);
        await service.enqueueReceiptUpload(makeFile(), makeUser(), undefined, longKey);
        const usedCacheKey = mockRedis.cacheSet.mock.calls[0][0];
        expect(usedCacheKey.length).toBeLessThanOrEqual('mobile:idem:'.length + makeUser().userId.length + 1 + 128);
    });
});
describe('MobileService.getExpenseStatus', () => {
    test('throws NotFoundException when ownership check returns no rows', async () => {
        const { service, mockRepo } = buildService();
        mockRepo.repository.manager.query.mockResolvedValue([]);
        await expect(service.getExpenseStatus('exp-1', TENANT_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns correct action_required for PENDING_OCR', async () => {
        const { service, mockRepo } = buildService();
        mockRepo.repository.manager.query.mockResolvedValue([{ id: 'exp-1' }]);
        mockRepo.repository.findOne.mockResolvedValue({
            id: 'exp-1', status: expense_entity_1.ExpenseStatus.PENDING_OCR, ocr_raw_json: {},
        });
        const result = await service.getExpenseStatus('exp-1', TENANT_ID);
        expect(result.action_required).toBe('wait');
        expect(result.status).toBe(expense_entity_1.ExpenseStatus.PENDING_OCR);
    });
    test('returns action_required=done for APPROVED status', async () => {
        const { service, mockRepo } = buildService();
        mockRepo.repository.manager.query.mockResolvedValue([{ id: 'exp-1' }]);
        mockRepo.repository.findOne.mockResolvedValue({
            id: 'exp-1', status: expense_entity_1.ExpenseStatus.APPROVED, ocr_raw_json: {},
        });
        const result = await service.getExpenseStatus('exp-1', TENANT_ID);
        expect(result.action_required).toBe('done');
    });
    test('returns action_required=in_review for NEEDS_REVIEW', async () => {
        const { service, mockRepo } = buildService();
        mockRepo.repository.manager.query.mockResolvedValue([{ id: 'exp-1' }]);
        mockRepo.repository.findOne.mockResolvedValue({
            id: 'exp-1', status: expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            ocr_raw_json: { diagnostics: { failure_reasons: [] } },
        });
        const result = await service.getExpenseStatus('exp-1', TENANT_ID);
        expect(result.action_required).toBe('in_review');
    });
    test('includes ocrData for COMPLETE status', async () => {
        const { service, mockRepo } = buildService();
        mockRepo.repository.manager.query.mockResolvedValue([{ id: 'exp-1' }]);
        mockRepo.repository.findOne.mockResolvedValue({
            id: 'exp-1', status: expense_entity_1.ExpenseStatus.COMPLETE,
            ocr_raw_json: { vendor: 'Grab', amount: 150000 },
        });
        const result = await service.getExpenseStatus('exp-1', TENANT_ID);
        expect(result.ocrData).toEqual({ vendor: 'Grab', amount: 150000 });
    });
});
//# sourceMappingURL=mobile.service.spec.js.map