"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const batch_export_processor_1 = require("../batch-export.processor");
const TENANT = 'tenant-uuid-1';
const JOB_ID = 'batch-job-uuid-1';
const FROM = '2026-01-01';
const TO = '2026-03-31';
function makePackage(expenseCount = 5) {
    return {
        schema_version: '2.0',
        metadata: {
            generated_at: new Date().toISOString(),
            period: { from: FROM, to: TO },
            tenant_name: 'Test Firm',
            company_display_name: 'Test Firm',
            logo_url: null,
            client_name: null,
            expense_count: expenseCount,
            total_original_vnd: '500000',
            total_deductible_vnd: '450000',
            total_pit_applicable_vnd: '50000',
            marked_as_exported: true,
        },
        expenses: [],
        summary: {
            by_gate: { gate_1: { count: 5, total_deductible_vnd: '450000' }, gate_2: { count: 0, total_deductible_vnd: '0' }, gate_3: { count: 0, total_deductible_vnd: '0' } },
            by_category: { travel_allowance: 5 },
            pit_summary: { expenses_with_pit: 1, total_pit_amount_vnd: '50000' },
            split_groups: [],
        },
        validation_report: {
            valid: true, issues: [], total_issues: 0, error_count: 0, warning_count: 0, info_count: 0, blocking_reasons: [],
        },
        supporting_documents: [],
    };
}
function buildProcessor(exportImpl, cachedState) {
    const mockErpService = { generateStructuredExport: jest.fn().mockImplementation(exportImpl) };
    const mockWebhook = { fireEvent: jest.fn().mockResolvedValue(undefined) };
    const cacheStore = new Map();
    if (cachedState)
        cacheStore.set(`batch_export:${JOB_ID}`, cachedState);
    const mockRedis = {
        cacheGet: jest.fn().mockImplementation(async (key) => cacheStore.get(key) ?? null),
        cacheSet: jest.fn().mockImplementation(async (key, val) => { cacheStore.set(key, val); }),
    };
    const processor = new batch_export_processor_1.BatchExportProcessor(mockErpService, mockWebhook, mockRedis);
    return { processor, mockErpService, mockWebhook, mockRedis, cacheStore };
}
function makeJob(data) {
    return { data };
}
const BASE_JOB_DATA = {
    tenantId: TENANT,
    jobId: JOB_ID,
    dto: { from: FROM, to: TO },
};
beforeEach(() => jest.clearAllMocks());
describe('BatchExportProcessor — success', () => {
    test('updates Redis to completed with metadata', async () => {
        const pkg = makePackage(5);
        const { processor, cacheStore } = buildProcessor(() => Promise.resolve(pkg));
        await processor.process(makeJob(BASE_JOB_DATA));
        const state = JSON.parse(cacheStore.get(`batch_export:${JOB_ID}`));
        expect(state.status).toBe('completed');
        expect(state.tenant_id).toBe(TENANT);
        expect(state.job_id).toBe(JOB_ID);
        expect(state.metadata.expense_count).toBe(5);
        expect(typeof state.completed_at).toBe('string');
    });
    test('fires export.batch.completed webhook after successful export', async () => {
        const pkg = makePackage(3);
        const { processor, mockWebhook } = buildProcessor(() => Promise.resolve(pkg));
        await processor.process(makeJob(BASE_JOB_DATA));
        expect(mockWebhook.fireEvent).toHaveBeenCalledWith(TENANT, 'export.batch.completed', expect.objectContaining({ job_id: JOB_ID, expense_count: 3 }));
    });
    test('calls generateStructuredExport with fireWebhook=false', async () => {
        const pkg = makePackage();
        const { processor, mockErpService } = buildProcessor(() => Promise.resolve(pkg));
        await processor.process(makeJob(BASE_JOB_DATA));
        const [, , opts] = mockErpService.generateStructuredExport.mock.calls[0];
        expect(opts.fireWebhook).toBe(false);
    });
    test('preserves queued_at from pre-existing Redis state', async () => {
        const queuedAt = '2026-06-09T10:00:00.000Z';
        const existingState = JSON.stringify({ status: 'queued', tenant_id: TENANT, job_id: JOB_ID, queued_at: queuedAt });
        const pkg = makePackage();
        const { processor, cacheStore } = buildProcessor(() => Promise.resolve(pkg), existingState);
        await processor.process(makeJob(BASE_JOB_DATA));
        const finalState = JSON.parse(cacheStore.get(`batch_export:${JOB_ID}`));
        expect(finalState.queued_at).toBe(queuedAt);
    });
});
describe('BatchExportProcessor — failure', () => {
    test('updates Redis to failed with error message', async () => {
        const { processor, cacheStore } = buildProcessor(() => Promise.reject(new Error('No approved expenses ready for export')));
        await expect(processor.process(makeJob(BASE_JOB_DATA))).rejects.toThrow();
        const state = JSON.parse(cacheStore.get(`batch_export:${JOB_ID}`));
        expect(state.status).toBe('failed');
        expect(state.error).toContain('No approved expenses');
        expect(typeof state.failed_at).toBe('string');
    });
    test('rethrows error so BullMQ can retry/fail the job', async () => {
        const { processor } = buildProcessor(() => Promise.reject(new Error('DB timeout')));
        await expect(processor.process(makeJob(BASE_JOB_DATA))).rejects.toThrow('DB timeout');
    });
    test('does NOT fire webhook on failure', async () => {
        const { processor, mockWebhook } = buildProcessor(() => Promise.reject(new Error('DB error')));
        await expect(processor.process(makeJob(BASE_JOB_DATA))).rejects.toThrow();
        expect(mockWebhook.fireEvent).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=batch-export.processor.spec.js.map