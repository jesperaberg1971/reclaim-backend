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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookRepository = void 0;
const common_1 = require("@nestjs/common");
const base_repository_1 = require("../../../database/repositories/base.repository");
const payment_webhook_entity_1 = require("../../../database/entities/payment-webhook.entity");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_1 = require("typeorm");
let PaymentWebhookRepository = class PaymentWebhookRepository extends base_repository_1.BaseRepository {
    constructor(cls, dataSource) {
        super(cls, dataSource, payment_webhook_entity_1.PaymentWebhook);
    }
};
exports.PaymentWebhookRepository = PaymentWebhookRepository;
exports.PaymentWebhookRepository = PaymentWebhookRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService, typeorm_1.DataSource])
], PaymentWebhookRepository);
//# sourceMappingURL=payment-webhook.repository.js.map