"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webhook_processor_1 = require("../webhook.processor");
const mockWebhookService = {
    updateDeliveryStatus: jest.fn().mockResolvedValue(undefined),
};
function buildProcessor() {
    return new webhook_processor_1.WebhookProcessor(mockWebhookService);
}
function makeJob(data, opts = {}) {
    return {
        data,
        opts: { attempts: opts.attempts ?? 3 },
        attemptsMade: opts.attemptsMade ?? 0,
    };
}
const BASE_DATA = {
    deliveryId: 'del-uuid-1',
    url: 'https://hook.example.com/receive',
    secret: 'mysecret',
    payloadJson: JSON.stringify({ event: 'export.completed', id: 'p-1', tenant_id: 't-1', data: {} }),
};
beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
});
describe('WebhookProcessor — successful delivery', () => {
    test('calls updateDeliveryStatus(delivered) on HTTP 200', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true, status: 200, text: async () => 'OK',
        });
        const processor = buildProcessor();
        await processor.process(makeJob(BASE_DATA));
        expect(mockWebhookService.updateDeliveryStatus).toHaveBeenCalledWith('del-uuid-1', 'delivered', 200, 'OK');
    });
    test('sets X-Reclaim-Signature header with sha256= prefix', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true, status: 200, text: async () => '',
        });
        const processor = buildProcessor();
        await processor.process(makeJob(BASE_DATA));
        const fetchCall = global.fetch.mock.calls[0];
        const headers = fetchCall[1].headers;
        expect(headers['X-Reclaim-Signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
    });
    test('sends correct Content-Type and body', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true, status: 200, text: async () => '',
        });
        const processor = buildProcessor();
        await processor.process(makeJob(BASE_DATA));
        const [url, init] = global.fetch.mock.calls[0];
        expect(url).toBe(BASE_DATA.url);
        expect(init.method).toBe('POST');
        expect(init.headers['Content-Type']).toBe('application/json');
        expect(init.body).toBe(BASE_DATA.payloadJson);
    });
});
describe('WebhookProcessor — HTTP failure', () => {
    test('on non-final attempt: throws without calling updateDeliveryStatus', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false, status: 503, text: async () => 'Service Unavailable',
        });
        const processor = buildProcessor();
        await expect(processor.process(makeJob(BASE_DATA, { attempts: 3, attemptsMade: 0 }))).rejects.toThrow();
        expect(mockWebhookService.updateDeliveryStatus).not.toHaveBeenCalled();
    });
    test('on final attempt: calls updateDeliveryStatus(failed) then throws', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false, status: 503, text: async () => 'Service Unavailable',
        });
        const processor = buildProcessor();
        await expect(processor.process(makeJob(BASE_DATA, { attempts: 3, attemptsMade: 2 }))).rejects.toThrow();
        expect(mockWebhookService.updateDeliveryStatus).toHaveBeenCalledWith('del-uuid-1', 'failed', 503, 'Service Unavailable');
    });
});
describe('WebhookProcessor — fetch error', () => {
    test('on final attempt: marks failed with error message', async () => {
        global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
        const processor = buildProcessor();
        await expect(processor.process(makeJob(BASE_DATA, { attempts: 3, attemptsMade: 2 }))).rejects.toThrow();
        expect(mockWebhookService.updateDeliveryStatus).toHaveBeenCalledWith('del-uuid-1', 'failed', null, 'ECONNREFUSED');
    });
    test('on non-final attempt: does NOT mark failed', async () => {
        global.fetch.mockRejectedValueOnce(new Error('timeout'));
        const processor = buildProcessor();
        await expect(processor.process(makeJob(BASE_DATA, { attempts: 3, attemptsMade: 0 }))).rejects.toThrow();
        expect(mockWebhookService.updateDeliveryStatus).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=webhook.processor.spec.js.map