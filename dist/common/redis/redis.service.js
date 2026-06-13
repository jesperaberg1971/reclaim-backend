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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const decimal_js_1 = require("decimal.js");
const config_1 = require("@nestjs/config");
const redis_config_1 = require("./redis-config");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = new ioredis_1.default({
            ...(0, redis_config_1.parseRedisConfig)(this.configService),
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3,
        });
        this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
        this.client.on('connect', () => this.logger.log('Redis connected'));
    }
    async onModuleInit() {
        try {
            await this.client.ping();
            this.logger.log('Redis ping OK');
        }
        catch (err) {
            this.logger.warn(`Redis ping failed at startup: ${err.message} — will retry on first use`);
        }
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    async ping() {
        const t = Date.now();
        await this.client.ping();
        return Date.now() - t;
    }
    async cacheGet(key) {
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async cacheSet(key, value, ttlSeconds) {
        try {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        catch (e) {
            this.logger.warn(`cacheSet failed key=${key}: ${e.message}`);
        }
    }
    async cacheDelete(key) {
        try {
            await this.client.del(key);
        }
        catch (e) {
            this.logger.warn(`cacheDelete failed key=${key}: ${e.message}`);
        }
    }
    async decrementDailyAllowance(employeeId, tripDecisionId, amount) {
        const key = `daily_allowance:${employeeId}:${tripDecisionId}`;
        try {
            await this.client.incrbyfloat(key, amount.neg().toNumber());
            this.logger.log(`Daily allowance decremented for trip ${tripDecisionId} by ${amount}`);
        }
        catch (error) {
            this.logger.error('Redis decrement failed – falling back to DB only', error);
        }
    }
    async getRemainingAllowance(employeeId, tripDecisionId) {
        const key = `daily_allowance:${employeeId}:${tripDecisionId}`;
        const value = await this.client.get(key);
        return value ? new decimal_js_1.Decimal(value) : new decimal_js_1.Decimal(0);
    }
    async setTempImage(key, base64) {
        await this.client.set(key, base64, 'EX', 3600);
    }
    async getTempImage(key) {
        return this.client.get(key);
    }
    async deleteTempImage(key) {
        await this.client.del(key);
    }
    ocrPeriod() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    async recordOcrOutcome(outcome) {
        const key = `ocr:outcomes:${this.ocrPeriod()}`;
        await this.client.hincrby(key, outcome, 1);
        await this.client.expire(key, 90 * 86_400);
    }
    async recordOcrFailureReasons(reasons) {
        if (!reasons.length)
            return;
        const key = `ocr:reasons:${this.ocrPeriod()}`;
        const pipe = this.client.pipeline();
        for (const r of reasons)
            pipe.hincrby(key, r, 1);
        pipe.expire(key, 90 * 86_400);
        await pipe.exec();
    }
    async getOcrMetrics(period) {
        const p = period ?? this.ocrPeriod();
        const [outcomes, reasons] = await Promise.all([
            this.client.hgetall(`ocr:outcomes:${p}`),
            this.client.hgetall(`ocr:reasons:${p}`),
        ]);
        const complete = parseInt(outcomes?.complete ?? '0', 10);
        const needsReview = parseInt(outcomes?.needs_review ?? '0', 10);
        const failed = parseInt(outcomes?.failed ?? '0', 10);
        const total = complete + needsReview + failed;
        return {
            period: p,
            outcomes: { complete, needs_review: needsReview, failed },
            failure_reasons: Object.fromEntries(Object.entries(reasons ?? {}).map(([k, v]) => [k, parseInt(v, 10)])),
            total,
            success_rate: total ? +(complete / total).toFixed(3) : 0,
            hitl_rate: total ? +(needsReview / total).toFixed(3) : 0,
            failure_rate: total ? +(failed / total).toFixed(3) : 0,
        };
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map