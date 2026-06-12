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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const subscription_service_1 = require("./subscription.service");
const change_plan_dto_1 = require("./dto/change-plan.dto");
const payment_webhook_dto_1 = require("./dto/payment-webhook.dto");
const billing_html_1 = require("./billing.html");
let SubscriptionController = class SubscriptionController {
    constructor(subscriptionService, configService) {
        this.subscriptionService = subscriptionService;
        this.configService = configService;
    }
    getBillingPage() {
        return (0, billing_html_1.buildBillingHtml)();
    }
    async getStatus(req) {
        return this.subscriptionService.getSubscriptionStatus(req.user.partnerId);
    }
    async changePlan(req, dto) {
        await this.subscriptionService.changePlan(req.user.partnerId, dto.plan_type);
        return { message: 'Plan updated' };
    }
    async cancel(req) {
        await this.subscriptionService.cancelSubscription(req.user.partnerId);
        return { message: 'Subscription cancelled' };
    }
    async reactivate(req) {
        const result = await this.subscriptionService.reactivateSubscription(req.user.partnerId);
        return { message: 'Subscription reactivated', invoice: result.invoice };
    }
    async listInvoices(req) {
        return this.subscriptionService.listInvoices(req.user.partnerId);
    }
    async getInvoice(id, req) {
        return this.subscriptionService.getInvoice(id, req.user.partnerId);
    }
    async createInvoice(req) {
        return this.subscriptionService.generateInvoice(req.user.partnerId);
    }
    async paymentWebhook(dto, secret) {
        const expected = this.configService.get('PAYMENT_WEBHOOK_SECRET');
        if (!expected)
            throw new common_1.UnauthorizedException('Webhook endpoint not configured');
        if (secret !== expected)
            throw new common_1.UnauthorizedException('Invalid webhook secret');
        return this.subscriptionService.processPaymentWebhook(dto);
    }
    async adminGenerateInvoice(partnerId) {
        return this.subscriptionService.generateInvoice(partnerId);
    }
    async adminListInvoices(partnerId) {
        return this.subscriptionService.listInvoices(partnerId);
    }
};
exports.SubscriptionController = SubscriptionController;
__decorate([
    (0, common_1.Get)('billing'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionController.prototype, "getBillingPage", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Put)('plan'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_plan_dto_1.ChangePlanDto]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "changePlan", null);
__decorate([
    (0, common_1.Post)('cancel'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('reactivate'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "reactivate", null);
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Post)('webhook/payment'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_webhook_dto_1.PaymentWebhookDto, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "paymentWebhook", null);
__decorate([
    (0, common_1.Post)('admin/generate-invoice/:partnerId'),
    (0, common_1.HttpCode)(201),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "adminGenerateInvoice", null);
__decorate([
    (0, common_1.Get)('admin/invoices/:partnerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "adminListInvoices", null);
exports.SubscriptionController = SubscriptionController = __decorate([
    (0, common_1.Controller)('subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService,
        config_1.ConfigService])
], SubscriptionController);
//# sourceMappingURL=subscription.controller.js.map