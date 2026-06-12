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
exports.PaymentWebhook = void 0;
const typeorm_1 = require("typeorm");
const partner_entity_1 = require("./partner.entity");
const invoice_entity_1 = require("./invoice.entity");
const decimal_column_transformer_1 = require("../transformers/decimal-column.transformer");
const decimal_js_1 = require("decimal.js");
let PaymentWebhook = class PaymentWebhook {
};
exports.PaymentWebhook = PaymentWebhook;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'manual' }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "provider_reference", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => partner_entity_1.Partner, { onDelete: 'SET NULL', nullable: true }),
    __metadata("design:type", partner_entity_1.Partner)
], PaymentWebhook.prototype, "partner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "partner_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => invoice_entity_1.Invoice, { onDelete: 'SET NULL', nullable: true }),
    __metadata("design:type", invoice_entity_1.Invoice)
], PaymentWebhook.prototype, "invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], PaymentWebhook.prototype, "amount_vnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: 'pending' }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '{}' }),
    __metadata("design:type", Object)
], PaymentWebhook.prototype, "raw_payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PaymentWebhook.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentWebhook.prototype, "created_at", void 0);
exports.PaymentWebhook = PaymentWebhook = __decorate([
    (0, typeorm_1.Entity)('payment_webhooks')
], PaymentWebhook);
//# sourceMappingURL=payment-webhook.entity.js.map