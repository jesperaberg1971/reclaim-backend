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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const decimal_js_1 = require("decimal.js");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const subscription_repository_1 = require("./repositories/subscription.repository");
const invoice_repository_1 = require("./repositories/invoice.repository");
const payment_webhook_repository_1 = require("./repositories/payment-webhook.repository");
const partner_repository_1 = require("../receipt/repositories/partner.repository");
const pdf_service_1 = require("../pdf/pdf.service");
const config_1 = require("@nestjs/config");
const TRIAL_DAYS = 14;
const GRACE_DAYS = 7;
const ANNUAL_MONTHS = 10;
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    constructor(subscriptionRepo, partnerRepo, invoiceRepo, webhookRepo, pdfService, configService, dataSource) {
        this.subscriptionRepo = subscriptionRepo;
        this.partnerRepo = partnerRepo;
        this.invoiceRepo = invoiceRepo;
        this.webhookRepo = webhookRepo;
        this.pdfService = pdfService;
        this.configService = configService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(SubscriptionService_1.name);
    }
    getTierAndPrice(clientCount) {
        if (clientCount <= 20)
            return { tier: 'micro', price: new decimal_js_1.Decimal('600000') };
        if (clientCount <= 50)
            return { tier: 'small', price: new decimal_js_1.Decimal('900000') };
        if (clientCount <= 75)
            return { tier: 'medium', price: new decimal_js_1.Decimal('1200000') };
        if (clientCount <= 100)
            return { tier: 'large', price: new decimal_js_1.Decimal('1500000') };
        return { tier: 'enterprise', price: new decimal_js_1.Decimal('2000000') };
    }
    getMaxClientsForTier(tier) {
        switch (tier) {
            case 'micro': return 20;
            case 'small': return 50;
            case 'medium': return 75;
            case 'large': return 100;
            default: return Infinity;
        }
    }
    computeEffectiveStatus(row) {
        const now = new Date();
        if (row.status === 'cancelled')
            return 'cancelled';
        if (row.status === 'overdue')
            return 'overdue';
        if (row.status === 'active')
            return 'active';
        if (row.status === 'trial') {
            if (!row.trial_ends_at || now <= row.trial_ends_at)
                return 'trial';
            const graceEnd = row.grace_period_ends_at
                ?? new Date(row.trial_ends_at.getTime() + GRACE_DAYS * 86_400_000);
            return now <= graceEnd ? 'grace' : 'overdue';
        }
        if (row.status === 'grace') {
            if (!row.grace_period_ends_at || now <= row.grace_period_ends_at)
                return 'grace';
            return 'overdue';
        }
        return row.status;
    }
    async getEffectiveStatus(partnerId) {
        const sub = await this.subscriptionRepo.repository.findOne({
            where: { partner_id: partnerId },
        });
        if (!sub)
            return 'trial';
        return this.computeEffectiveStatus(sub);
    }
    async getSubscriptionStatus(partnerId) {
        const [{ cnt }] = await this.dataSource.query(`SELECT COUNT(*)::int AS cnt FROM clients WHERE partner_id = $1`, [partnerId]);
        const clientCount = cnt ?? 0;
        const { tier, price } = this.getTierAndPrice(clientCount);
        let subscription = await this.subscriptionRepo.repository.findOne({
            where: { partner_id: partnerId },
        });
        if (!subscription) {
            const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
            subscription = this.subscriptionRepo.repository.create({
                partner_id: partnerId,
                tier: tier,
                monthly_price_vnd: price,
                is_beta_pilot: true,
                next_billing_date: trialEndsAt,
                status: 'trial',
                plan_type: 'monthly',
                trial_ends_at: trialEndsAt,
            });
            await this.subscriptionRepo.repository.save(subscription);
        }
        const effectiveStatus = this.computeEffectiveStatus(subscription);
        const daysSinceSignup = (Date.now() - subscription.created_at.getTime()) / 86_400_000;
        const isBetaActive = subscription.is_beta_pilot && daysSinceSignup <= 90;
        const discountPct = isBetaActive ? 50 : 0;
        const discountedPrice = price.mul(1 - discountPct / 100);
        let pendingUpgrade;
        if (clientCount > this.getMaxClientsForTier(subscription.tier)) {
            const next = this.getTierAndPrice(clientCount);
            pendingUpgrade = { newTier: next.tier, newPriceVnd: next.price };
        }
        return {
            tier: tier,
            monthlyPriceVnd: price,
            clientCount,
            nextBillingDate: subscription.next_billing_date,
            isBetaPilot: subscription.is_beta_pilot,
            discountPercentage: discountPct,
            discountedPriceVnd: discountedPrice,
            pendingUpgrade,
            status: effectiveStatus,
            planType: subscription.plan_type,
            trialEndsAt: subscription.trial_ends_at,
            gracePeriodEndsAt: subscription.grace_period_ends_at,
        };
    }
    async changePlan(partnerId, planType) {
        const sub = await this.requireSubscription(partnerId);
        if (sub.plan_type === planType)
            return;
        await this.subscriptionRepo.repository.update(sub.id, { plan_type: planType });
        this.logger.log(`Partner ${partnerId} changed plan to ${planType}`);
    }
    async cancelSubscription(partnerId) {
        const sub = await this.requireSubscription(partnerId);
        if (sub.status === 'cancelled')
            return;
        await this.subscriptionRepo.repository.update(sub.id, {
            status: 'cancelled',
            cancelled_at: new Date(),
        });
        this.logger.log(`Partner ${partnerId} cancelled subscription`);
    }
    async reactivateSubscription(partnerId) {
        const sub = await this.requireSubscription(partnerId);
        const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000);
        await this.subscriptionRepo.repository.update(sub.id, {
            status: 'trial',
            cancelled_at: null,
            grace_period_ends_at: null,
            trial_ends_at: trialEndsAt,
            next_billing_date: trialEndsAt,
        });
        this.logger.log(`Partner ${partnerId} reactivated subscription`);
        const invoice = await this.generateInvoice(partnerId);
        return { invoice };
    }
    async generateInvoice(partnerId) {
        const partner = await this.partnerRepo.repository.findOne({ where: { id: partnerId } });
        if (!partner)
            throw new common_1.NotFoundException(`Partner ${partnerId} not found`);
        const sub = await this.requireSubscription(partnerId);
        const clients = await this.dataSource.query(`SELECT COUNT(*)::int AS cnt FROM clients WHERE partner_id = $1`, [partnerId]);
        const clientCount = clients[0]?.cnt ?? 0;
        const { price } = this.getTierAndPrice(clientCount);
        const daysSinceSignup = (Date.now() - sub.created_at.getTime()) / 86_400_000;
        const discountPct = sub.is_beta_pilot && daysSinceSignup <= 90 ? 50 : 0;
        const discountedPrice = price.mul(1 - discountPct / 100);
        const isAnnual = sub.plan_type === 'annual';
        const amountVnd = isAnnual ? discountedPrice.mul(ANNUAL_MONTHS) : discountedPrice;
        const periodStart = new Date();
        const periodEnd = new Date(periodStart.getTime() + (isAnnual ? 365 : 30) * 86_400_000);
        const dueDate = new Date(periodStart.getTime() + 14 * 86_400_000);
        const [{ next_seq }] = await this.dataSource.query(`SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INT)), 0) + 1 AS next_seq
       FROM invoices WHERE partner_id = $1`, [partnerId]);
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(next_seq).padStart(4, '0')}`;
        const invoice = this.invoiceRepo.repository.create({
            partner_id: partnerId,
            subscription_id: sub.id,
            invoice_number: invoiceNumber,
            period_start: periodStart,
            period_end: periodEnd,
            amount_vnd: amountVnd,
            status: 'pending',
            due_date: dueDate,
        });
        const saved = await this.invoiceRepo.repository.save(invoice);
        void this.buildAndAttachPdf(saved, partner, sub, price, discountPct, amountVnd, isAnnual);
        return saved;
    }
    async buildAndAttachPdf(invoice, partner, sub, monthlyPrice, discountPct, amountVnd, isAnnual) {
        try {
            const ref = await this.pdfService.generateInvoicePdf({
                invoiceNumber: invoice.invoice_number,
                partnerName: partner.name,
                partnerTaxCode: partner.tax_code,
                issuedAt: invoice.created_at,
                dueDate: invoice.due_date,
                periodStart: invoice.period_start,
                periodEnd: invoice.period_end,
                tier: sub.tier,
                planType: isAnnual ? 'annual' : 'monthly',
                monthlyPriceVnd: monthlyPrice,
                discountPercentage: discountPct,
                amountVnd,
                status: 'pending',
            });
            await this.invoiceRepo.repository.update(invoice.id, { pdf_path: ref.url });
        }
        catch (e) {
            this.logger.warn(`Failed to generate PDF for invoice ${invoice.id}: ${e.message}`);
        }
    }
    async listInvoices(partnerId) {
        return this.invoiceRepo.repository.find({
            where: { partner_id: partnerId },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }
    async getInvoice(invoiceId, partnerId) {
        const invoice = await this.invoiceRepo.repository.findOne({
            where: { id: invoiceId, partner_id: partnerId },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return invoice;
    }
    async processPaymentWebhook(dto) {
        const safePayload = {
            provider: dto.provider,
            provider_reference: dto.provider_reference,
            partner_id: dto.partner_id,
            invoice_id: dto.invoice_id ?? null,
            amount_vnd: dto.amount_vnd,
            note: dto.note ?? null,
        };
        const wh = this.webhookRepo.repository.create({
            provider: dto.provider,
            provider_reference: dto.provider_reference,
            partner_id: dto.partner_id,
            invoice_id: dto.invoice_id,
            amount_vnd: new decimal_js_1.Decimal(dto.amount_vnd),
            status: 'pending',
            raw_payload: safePayload,
        });
        const saved = await this.webhookRepo.repository.save(wh);
        let invoice = null;
        if (dto.invoice_id) {
            invoice = await this.invoiceRepo.repository.findOne({
                where: { id: dto.invoice_id, partner_id: dto.partner_id },
            });
        }
        else {
            invoice = await this.invoiceRepo.repository.findOne({
                where: { partner_id: dto.partner_id, status: 'pending' },
                order: { created_at: 'ASC' },
            });
        }
        if (!invoice) {
            await this.webhookRepo.repository.update(saved.id, { status: 'rejected', processed_at: new Date() });
            return { processed: false, message: 'No matching pending invoice found' };
        }
        const expectedAmount = invoice.amount_vnd instanceof decimal_js_1.Decimal
            ? invoice.amount_vnd
            : new decimal_js_1.Decimal(invoice.amount_vnd);
        const receivedAmount = new decimal_js_1.Decimal(dto.amount_vnd);
        if (receivedAmount.sub(expectedAmount).abs().gt(1)) {
            await this.webhookRepo.repository.update(saved.id, { status: 'rejected', processed_at: new Date() });
            return {
                processed: false,
                message: `Amount mismatch: expected ${expectedAmount.toFixed(0)}, got ${receivedAmount.toFixed(0)}`,
            };
        }
        await this.invoiceRepo.repository.update(invoice.id, {
            status: 'paid',
            paid_at: new Date(),
        });
        const nextBillingDate = new Date(invoice.period_end);
        await this.subscriptionRepo.repository.update({ partner_id: dto.partner_id }, {
            status: 'active',
            next_billing_date: nextBillingDate,
            grace_period_ends_at: null,
            cancelled_at: null,
        });
        await this.webhookRepo.repository.update(saved.id, {
            invoice_id: invoice.id,
            status: 'confirmed',
            processed_at: new Date(),
        });
        this.logger.log(`Payment confirmed for partner ${dto.partner_id}, invoice ${invoice.invoice_number}`);
        return { processed: true, message: `Invoice ${invoice.invoice_number} marked paid. Subscription activated.` };
    }
    async triggerQuarterlyUpgradeCheck() {
        this.logger.log('Quarterly tier upgrade check executed');
    }
    async requireSubscription(partnerId) {
        const sub = await this.subscriptionRepo.repository.findOne({
            where: { partner_id: partnerId },
        });
        if (!sub)
            throw new common_1.NotFoundException(`No subscription found for partner ${partnerId}`);
        return sub;
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [subscription_repository_1.SubscriptionRepository,
        partner_repository_1.PartnerRepository,
        invoice_repository_1.InvoiceRepository,
        payment_webhook_repository_1.PaymentWebhookRepository,
        pdf_service_1.PdfService,
        config_1.ConfigService,
        typeorm_1.DataSource])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map