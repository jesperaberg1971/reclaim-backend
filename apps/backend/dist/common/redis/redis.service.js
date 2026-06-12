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
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3,
        });
        this.client.on('error', (err) => this.logger.error('Redis Client Error', err));
        this.client.on('connect', () => this.logger.log('Redis connected'));
    }
    async onModuleInit() {
        await this.client.ping();
    }
    async onModuleDestroy() {
        await this.client.quit();
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
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map