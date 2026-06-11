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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("typeorm");
const crypto = require("crypto");
const queue_constants_1 = require("../queue/queue.constants");
let WebhookService = WebhookService_1 = class WebhookService {
    constructor(dataSource, deliveryQueue) {
        this.dataSource = dataSource;
        this.deliveryQueue = deliveryQueue;
        this.logger = new common_1.Logger(WebhookService_1.name);
    }
    async registerEndpoint(tenantId, dto) {
        const secret = crypto.randomBytes(32).toString('hex');
        const [row] = await this.dataSource.query(`
      INSERT INTO webhook_endpoints (partner_id, url, secret, events)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (partner_id, url) DO UPDATE
        SET events = EXCLUDED.events, is_active = true
      RETURNING id, url, events, is_active, created_at
    `, [tenantId, dto.url, secret, dto.events]);
        return { ...this.toEndpoint(row), secret };
    }
    async listEndpoints(tenantId) {
        const rows = await this.dataSource.query(`SELECT id, url, events, is_active, created_at
       FROM webhook_endpoints WHERE partner_id = $1 ORDER BY created_at DESC`, [tenantId]);
        return rows.map((r) => this.toEndpoint(r));
    }
    async deleteEndpoint(tenantId, endpointId) {
        const result = await this.dataSource.query(`DELETE FROM webhook_endpoints WHERE id = $1 AND partner_id = $2 RETURNING id`, [endpointId, tenantId]);
        if (!result.length)
            throw new common_1.NotFoundException(`Webhook endpoint ${endpointId} not found`);
    }
    async getDeliveries(tenantId, endpointId, limit = 20) {
        const [ep] = await this.dataSource.query(`SELECT id FROM webhook_endpoints WHERE id = $1 AND partner_id = $2`, [endpointId, tenantId]);
        if (!ep)
            throw new common_1.NotFoundException(`Webhook endpoint ${endpointId} not found`);
        const rows = await this.dataSource.query(`
      SELECT id, event, status, response_status, attempts, last_attempted_at, created_at
      FROM webhook_deliveries WHERE endpoint_id = $1
      ORDER BY created_at DESC LIMIT $2
    `, [endpointId, limit]);
        return rows.map((r) => this.toDelivery(r));
    }
    async fireEvent(tenantId, event, data) {
        const endpoints = await this.dataSource.query(`SELECT id, url, secret FROM webhook_endpoints
       WHERE partner_id = $1 AND is_active = true AND events @> ARRAY[$2]::text[]`, [tenantId, event]);
        if (!endpoints.length)
            return;
        const payload = {
            id: crypto.randomUUID(),
            event,
            timestamp: new Date().toISOString(),
            tenant_id: tenantId,
            data,
        };
        const payloadJson = JSON.stringify(payload);
        for (const ep of endpoints) {
            try {
                const [delivery] = await this.dataSource.query(`
          INSERT INTO webhook_deliveries (endpoint_id, event, payload)
          VALUES ($1, $2, $3) RETURNING id
        `, [ep.id, event, payloadJson]);
                await this.deliveryQueue.add('deliver', {
                    deliveryId: delivery.id,
                    url: ep.url,
                    secret: ep.secret,
                    payloadJson,
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5_000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 100 },
                });
            }
            catch (e) {
                this.logger.warn(`Failed to enqueue webhook for ${ep.url}: ${e.message}`);
            }
        }
    }
    async updateDeliveryStatus(deliveryId, status, responseStatus, responseBody) {
        await this.dataSource.query(`
      UPDATE webhook_deliveries
      SET status            = $1,
          response_status   = $2,
          response_body     = $3,
          attempts          = attempts + 1,
          last_attempted_at = NOW()
      WHERE id = $4
    `, [status, responseStatus, responseBody, deliveryId]);
    }
    toEndpoint(r) {
        return {
            id: r.id,
            url: r.url,
            events: r.events ?? [],
            is_active: Boolean(r.is_active),
            created_at: new Date(r.created_at).toISOString(),
        };
    }
    toDelivery(r) {
        return {
            id: r.id,
            event: r.event,
            status: r.status,
            response_status: r.response_status ?? null,
            attempts: Number(r.attempts),
            last_attempted_at: r.last_attempted_at ? new Date(r.last_attempted_at).toISOString() : null,
            created_at: new Date(r.created_at).toISOString(),
        };
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)(queue_constants_1.WEBHOOK_DELIVERY_QUEUE)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        bullmq_2.Queue])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map