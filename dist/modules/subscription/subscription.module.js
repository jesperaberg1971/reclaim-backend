"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const subscription_service_1 = require("./subscription.service");
const subscription_controller_1 = require("./subscription.controller");
const subscription_repository_1 = require("./repositories/subscription.repository");
const invoice_repository_1 = require("./repositories/invoice.repository");
const payment_webhook_repository_1 = require("./repositories/payment-webhook.repository");
const partner_repository_1 = require("../receipt/repositories/partner.repository");
const subscription_entity_1 = require("../../database/entities/subscription.entity");
const invoice_entity_1 = require("../../database/entities/invoice.entity");
const payment_webhook_entity_1 = require("../../database/entities/payment-webhook.entity");
const pdf_module_1 = require("../pdf/pdf.module");
let SubscriptionModule = class SubscriptionModule {
};
exports.SubscriptionModule = SubscriptionModule;
exports.SubscriptionModule = SubscriptionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([subscription_entity_1.Subscription, invoice_entity_1.Invoice, payment_webhook_entity_1.PaymentWebhook]),
            pdf_module_1.PdfModule,
        ],
        controllers: [subscription_controller_1.SubscriptionController],
        providers: [
            subscription_service_1.SubscriptionService,
            subscription_repository_1.SubscriptionRepository,
            invoice_repository_1.InvoiceRepository,
            payment_webhook_repository_1.PaymentWebhookRepository,
            partner_repository_1.PartnerRepository,
        ],
        exports: [subscription_service_1.SubscriptionService],
    })
], SubscriptionModule);
//# sourceMappingURL=subscription.module.js.map