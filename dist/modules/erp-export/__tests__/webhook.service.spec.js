"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const webhook_service_1 = require("../webhook.service");
const TENANT = 'tenant-uuid-1';
const ENDPOINT_ID = 'ep-uuid-1';
function buildService(queryImpl) {
    const queryMock = jest.fn().mockImplementation((sql, params) => queryImpl(sql, params));
    const ds = { query: queryMock };
    const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'bullmq-job-1' }),
    };
    return {
        service: new webhook_service_1.WebhookService(ds, mockQueue),
        queryMock,
        mockQueue,
    };
}
beforeEach(() => jest.clearAllMocks());
describe('WebhookService.registerEndpoint', () => {
    test('inserts endpoint and returns it with secret', async () => {
        const row = { id: ENDPOINT_ID, url: 'https://example.com/hook', events: ['export.completed'], is_active: true, created_at: new Date() };
        const { service } = buildService(() => Promise.resolve([row]));
        const result = await service.registerEndpoint(TENANT, { url: row.url, events: ['export.completed'] });
        expect(result.id).toBe(ENDPOINT_ID);
        expect(result.url).toBe(row.url);
        expect(typeof result.secret).toBe('string');
        expect(result.secret).toHaveLength(64);
    });
});
describe('WebhookService.listEndpoints', () => {
    test('returns empty array when no endpoints', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        const result = await service.listEndpoints(TENANT);
        expect(result).toEqual([]);
    });
    test('maps rows to WebhookEndpoint shape', async () => {
        const rows = [
            { id: 'ep-1', url: 'https://a.com', events: ['export.completed'], is_active: true, created_at: new Date() },
            { id: 'ep-2', url: 'https://b.com', events: ['export.batch.completed'], is_active: false, created_at: new Date() },
        ];
        const { service } = buildService(() => Promise.resolve(rows));
        const result = await service.listEndpoints(TENANT);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('ep-1');
        expect(result[1].is_active).toBe(false);
        expect(typeof result[0].created_at).toBe('string');
    });
});
describe('WebhookService.deleteEndpoint', () => {
    test('throws NotFoundException when endpoint not found', async () => {
        const { service } = buildService(() => Promise.resolve([]));
        await expect(service.deleteEndpoint(TENANT, ENDPOINT_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('resolves without error when found', async () => {
        const { service } = buildService(() => Promise.resolve([{ id: ENDPOINT_ID }]));
        await expect(service.deleteEndpoint(TENANT, ENDPOINT_ID)).resolves.toBeUndefined();
    });
});
describe('WebhookService.getDeliveries', () => {
    test('throws NotFoundException when endpoint not found', async () => {
        const { service } = buildService((sql) => {
            if (sql.includes('FROM webhook_endpoints'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        await expect(service.getDeliveries(TENANT, ENDPOINT_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('returns mapped deliveries after ownership check passes', async () => {
        const deliveryRow = {
            id: 'del-1', event: 'export.completed', status: 'delivered',
            response_status: 200, attempts: 1, last_attempted_at: new Date(), created_at: new Date(),
        };
        const { service } = buildService((sql) => {
            if (sql.includes('FROM webhook_endpoints'))
                return Promise.resolve([{ id: ENDPOINT_ID }]);
            return Promise.resolve([deliveryRow]);
        });
        const result = await service.getDeliveries(TENANT, ENDPOINT_ID);
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('delivered');
        expect(result[0].response_status).toBe(200);
        expect(result[0].attempts).toBe(1);
    });
});
describe('WebhookService.fireEvent', () => {
    test('does nothing when no active endpoints for event', async () => {
        const { service, mockQueue } = buildService(() => Promise.resolve([]));
        await service.fireEvent(TENANT, 'export.completed', { expense_count: 5 });
        expect(mockQueue.add).not.toHaveBeenCalled();
    });
    test('enqueues one delivery job per active endpoint', async () => {
        const endpoints = [
            { id: 'ep-1', url: 'https://a.com/hook', secret: 'secret1' },
            { id: 'ep-2', url: 'https://b.com/hook', secret: 'secret2' },
        ];
        const { service, mockQueue } = buildService((sql) => {
            if (sql.includes('FROM webhook_endpoints'))
                return Promise.resolve(endpoints);
            if (sql.includes('INSERT INTO webhook_deliveries'))
                return Promise.resolve([{ id: 'del-uuid' }]);
            return Promise.resolve([]);
        });
        await service.fireEvent(TENANT, 'export.completed', { expense_count: 10 });
        expect(mockQueue.add).toHaveBeenCalledTimes(2);
        const jobData = mockQueue.add.mock.calls[0][1];
        expect(jobData.url).toBe('https://a.com/hook');
        expect(jobData.payloadJson).toContain('"export.completed"');
        expect(jobData.payloadJson).toContain(`"tenant_id":"${TENANT}"`);
    });
    test('payload JSON includes expected event structure', async () => {
        const { service, mockQueue } = buildService((sql) => {
            if (sql.includes('FROM webhook_endpoints'))
                return Promise.resolve([{ id: 'ep-1', url: 'https://hook.io', secret: 'sec' }]);
            if (sql.includes('INSERT INTO webhook_deliveries'))
                return Promise.resolve([{ id: 'del-1' }]);
            return Promise.resolve([]);
        });
        await service.fireEvent(TENANT, 'export.batch.completed', { job_id: 'job-1', expense_count: 3 });
        const payloadJson = mockQueue.add.mock.calls[0][1].payloadJson;
        const payload = JSON.parse(payloadJson);
        expect(payload.event).toBe('export.batch.completed');
        expect(payload.tenant_id).toBe(TENANT);
        expect(payload.data.job_id).toBe('job-1');
        expect(typeof payload.id).toBe('string');
        expect(typeof payload.timestamp).toBe('string');
    });
    test('continues to next endpoint if one enqueue fails', async () => {
        let callCount = 0;
        const { service, mockQueue } = buildService((sql) => {
            if (sql.includes('FROM webhook_endpoints'))
                return Promise.resolve([
                    { id: 'ep-1', url: 'https://a.com', secret: 'sec1' },
                    { id: 'ep-2', url: 'https://b.com', secret: 'sec2' },
                ]);
            if (sql.includes('INSERT INTO webhook_deliveries')) {
                callCount++;
                if (callCount === 1)
                    throw new Error('DB error');
                return Promise.resolve([{ id: `del-${callCount}` }]);
            }
            return Promise.resolve([]);
        });
        await expect(service.fireEvent(TENANT, 'export.completed', {})).resolves.toBeUndefined();
        expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });
});
describe('WebhookService.updateDeliveryStatus', () => {
    test('updates delivery row with status and response info', async () => {
        const { service, queryMock } = buildService(() => Promise.resolve([]));
        await service.updateDeliveryStatus('del-1', 'delivered', 200, 'OK');
        const [sql, params] = queryMock.mock.calls[0];
        expect(sql).toContain('UPDATE webhook_deliveries');
        expect(params[0]).toBe('delivered');
        expect(params[1]).toBe(200);
        expect(params[2]).toBe('OK');
        expect(params[3]).toBe('del-1');
    });
});
//# sourceMappingURL=webhook.service.spec.js.map