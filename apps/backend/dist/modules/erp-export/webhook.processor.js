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
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const webhook_service_1 = require("./webhook.service");
const queue_constants_1 = require("../queue/queue.constants");
const DELIVERY_TIMEOUT_MS = 10_000;
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(webhookService) {
        super();
        this.webhookService = webhookService;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    async process(job) {
        const { deliveryId, url, secret, payloadJson } = job.data;
        const signature = 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(payloadJson)
            .digest('hex');
        const maxAttempts = job.opts?.attempts ?? 3;
        const isFinalAttempt = job.attemptsMade >= maxAttempts - 1;
        let responseStatus = null;
        let responseBody = null;
        let succeeded = false;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
            let res;
            try {
                res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Reclaim-Signature': signature,
                    },
                    body: payloadJson,
                    signal: controller.signal,
                });
            }
            finally {
                clearTimeout(timeout);
            }
            responseStatus = res.status;
            responseBody = (await res.text()).slice(0, 500);
            succeeded = res.ok;
        }
        catch (fetchErr) {
            responseBody = fetchErr.message?.slice(0, 500) ?? 'fetch error';
        }
        if (succeeded) {
            await this.webhookService.updateDeliveryStatus(deliveryId, 'delivered', responseStatus, responseBody);
            this.logger.log(`Webhook delivered: ${url} status=${responseStatus}`);
            return;
        }
        if (isFinalAttempt) {
            await this.webhookService.updateDeliveryStatus(deliveryId, 'failed', responseStatus, responseBody);
            this.logger.warn(`Webhook delivery exhausted: ${url} attempts=${job.attemptsMade + 1}`);
        }
        throw new Error(`Webhook delivery failed: ${url} status=${responseStatus ?? 'fetch_error'}`);
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.WEBHOOK_DELIVERY_QUEUE, { concurrency: 5 }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [webhook_service_1.WebhookService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map