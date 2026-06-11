"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BatchExportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchExportProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const erp_export_service_1 = require("./erp-export.service");
const webhook_service_1 = require("./webhook.service");
const redis_service_1 = require("../../common/redis/redis.service");
const queue_constants_1 = require("../queue/queue.constants");
const BATCH_RESULT_TTL = 3_600;
let BatchExportProcessor = BatchExportProcessor_1 = class BatchExportProcessor extends bullmq_1.WorkerHost {
    constructor(erpService, webhookService, redisService) {
        super();
        this.erpService = erpService;
        this.webhookService = webhookService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(BatchExportProcessor_1.name);
    }
    async process(job) {
        const { tenantId, jobId, dto } = job.data;
        const redisKey = `batch_export:${jobId}`;
        const existing = await this.redisService.cacheGet(redisKey);
        const queued_at = existing ? JSON.parse(existing).queued_at : new Date().toISOString();
        await this.redisService.cacheSet(redisKey, JSON.stringify({ status: 'processing', tenant_id: tenantId, job_id: jobId, queued_at, started_at: new Date().toISOString() }), BATCH_RESULT_TTL);
        try {
            const pkg = await this.erpService.generateStructuredExport(tenantId, dto, { fireWebhook: false });
            const state = {
                status: 'completed',
                tenant_id: tenantId,
                job_id: jobId,
                queued_at,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                metadata: pkg.metadata,
                summary: pkg.summary,
                validation_report: pkg.validation_report,
            };
            await this.redisService.cacheSet(redisKey, JSON.stringify(state), BATCH_RESULT_TTL);
            this.logger.log(`Batch export completed: jobId=${jobId} expenses=${pkg.metadata.expense_count}`);
            void this.webhookService.fireEvent(tenantId, 'export.batch.completed', {
                job_id: jobId,
                export_format: 'structured_v2',
                expense_count: pkg.metadata.expense_count,
                total_deductible_vnd: pkg.metadata.total_deductible_vnd,
                period: pkg.metadata.period,
                marked_as_exported: pkg.metadata.marked_as_exported,
            });
        }
        catch (err) {
            await this.redisService.cacheSet(redisKey, JSON.stringify({
                status: 'failed',
                tenant_id: tenantId,
                job_id: jobId,
                queued_at,
                failed_at: new Date().toISOString(),
                error: err.message,
            }), BATCH_RESULT_TTL);
            this.logger.error(`Batch export failed: jobId=${jobId} — ${err.message}`);
            throw err;
        }
    }
};
exports.BatchExportProcessor = BatchExportProcessor;
exports.BatchExportProcessor = BatchExportProcessor = BatchExportProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.BATCH_EXPORT_QUEUE, { concurrency: 2 }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [erp_export_service_1.ErpExportService,
        webhook_service_1.WebhookService,
        redis_service_1.RedisService])
], BatchExportProcessor);
//# sourceMappingURL=batch-export.processor.js.map