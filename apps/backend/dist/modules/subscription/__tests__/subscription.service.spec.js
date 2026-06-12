"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const common_1 = require("@nestjs/common");
const subscription_service_1 = require("../subscription.service");
const PARTNER_ID = 'partner-uuid-1';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
function makeSubscription(overrides = {}) {
    return {
        id: 'sub-uuid-1',
        partner_id: PARTNER_ID,
        tier: 'micro',
        monthly_price_vnd: new decimal_js_1.Decimal('600000'),
        is_beta_pilot: false,
        created_at: new Date(Date.now() - 100 * MS_PER_DAY),
        next_billing_date: new Date(Date.now() + 30 * MS_PER_DAY),
        status: 'active',
        plan_type: 'monthly',
        trial_ends_at: null,
        grace_period_ends_at: null,
        cancelled_at: null,
        ...overrides,
    };
}
function makeInvoice(overrides = {}) {
    return {
        id: 'inv-uuid-1',
        partner_id: PARTNER_ID,
        invoice_number: 'INV-2026-0001',
        amount_vnd: new decimal_js_1.Decimal('600000'),
        status: 'pending',
        period_start: new Date(),
        period_end: new Date(Date.now() + 30 * MS_PER_DAY),
        due_date: new Date(Date.now() + 14 * MS_PER_DAY),
        created_at: new Date(),
        pdf_path: null,
        ...overrides,
    };
}
function buildService(opts = {}) {
    const clientCount = opts.clientCount ?? 5;
    const subscription = opts.subscription !== undefined ? opts.subscription : makeSubscription();
    const partner = opts.partner !== undefined ? opts.partner
        : { id: PARTNER_ID, name: 'Test Corp', tax_code: '0123456789' };
    const partnerClients = Array.from({ length: clientCount }, () => ({}));
    const partnerWithClients = partner ? { ...partner, clients: partnerClients } : null;
    const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(partnerWithClients),
    };
    const partnerRepo = {
        repository: {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
            findOne: jest.fn().mockResolvedValue(partner),
        },
    };
    const createdSub = { ...makeSubscription({ is_beta_pilot: true, created_at: new Date(), status: 'trial' }) };
    const savedInvoice = opts.invoice !== undefined ? opts.invoice : makeInvoice();
    const subscriptionRepo = {
        repository: {
            findOne: jest.fn().mockResolvedValue(subscription),
            create: jest.fn().mockReturnValue(createdSub),
            save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
            update: jest.fn().mockResolvedValue({}),
        },
    };
    const invoiceRepo = {
        repository: {
            findOne: jest.fn().mockResolvedValue(savedInvoice),
            find: jest.fn().mockResolvedValue(savedInvoice ? [savedInvoice] : []),
            create: jest.fn().mockImplementation((d) => ({ ...makeInvoice(), ...d })),
            save: jest.fn().mockImplementation((i) => Promise.resolve(i)),
            update: jest.fn().mockResolvedValue({}),
        },
    };
    const webhookRepo = {
        repository: {
            create: jest.fn().mockImplementation((d) => d),
            save: jest.fn().mockImplementation((d) => Promise.resolve({ id: 'wh-1', ...d })),
            update: jest.fn().mockResolvedValue({}),
        },
    };
    const pdfService = {
        generateInvoicePdf: jest.fn().mockResolvedValue({ url: '/api/files/invoices/INV-2026-0001.pdf', filename: 'INV-2026-0001.pdf' }),
    };
    const configService = { get: jest.fn() };
    const dataSource = {
        query: jest.fn()
            .mockResolvedValueOnce([{ cnt: clientCount }])
            .mockResolvedValueOnce([{ next_seq: 1 }]),
    };
    const service = new subscription_service_1.SubscriptionService(subscriptionRepo, partnerRepo, invoiceRepo, webhookRepo, pdfService, configService, dataSource);
    return { service, subscriptionRepo, invoiceRepo, webhookRepo, pdfService, dataSource };
}
beforeEach(() => jest.clearAllMocks());
describe('SubscriptionService — tier calculation', () => {
    test.each([
        [0, 'micro', '600000'],
        [20, 'micro', '600000'],
        [21, 'small', '900000'],
        [50, 'small', '900000'],
        [51, 'medium', '1200000'],
        [75, 'medium', '1200000'],
        [76, 'large', '1500000'],
        [100, 'large', '1500000'],
        [101, 'enterprise', '2000000'],
    ])('clientCount=%i → tier=%s price=%s VND', async (clientCount, expectedTier, expectedPrice) => {
        const { service } = buildService({ clientCount });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.tier).toBe(expectedTier);
        expect(result.monthlyPriceVnd.toFixed(0)).toBe(expectedPrice);
        expect(result.clientCount).toBe(clientCount);
    });
});
describe('SubscriptionService — beta pilot discount', () => {
    test('50% discount when is_beta_pilot=true and signed up 45 days ago', async () => {
        const { service } = buildService({
            subscription: makeSubscription({ is_beta_pilot: true, created_at: new Date(Date.now() - 45 * MS_PER_DAY) }),
        });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.discountPercentage).toBe(50);
        expect(result.discountedPriceVnd.toFixed(0)).toBe('300000');
    });
    test('0% discount after 90 days even when is_beta_pilot=true', async () => {
        const { service } = buildService({
            subscription: makeSubscription({ is_beta_pilot: true, created_at: new Date(Date.now() - 91 * MS_PER_DAY) }),
        });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.discountPercentage).toBe(0);
        expect(result.discountedPriceVnd.toFixed(0)).toBe('600000');
    });
    test('0% discount when is_beta_pilot=false', async () => {
        const { service } = buildService({
            subscription: makeSubscription({ is_beta_pilot: false, created_at: new Date(Date.now() - 1 * MS_PER_DAY) }),
        });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.discountPercentage).toBe(0);
    });
});
describe('SubscriptionService — auto-create on first access', () => {
    test('creates subscription when none exists', async () => {
        const { service, subscriptionRepo } = buildService({ subscription: null });
        await service.getSubscriptionStatus(PARTNER_ID);
        expect(subscriptionRepo.repository.create).toHaveBeenCalledWith(expect.objectContaining({ partner_id: PARTNER_ID, is_beta_pilot: true, status: 'trial' }));
        expect(subscriptionRepo.repository.save).toHaveBeenCalled();
    });
});
describe('SubscriptionService — pending upgrade', () => {
    test('pendingUpgrade set when clientCount exceeds stored tier max', async () => {
        const { service } = buildService({
            clientCount: 25,
            subscription: makeSubscription({ tier: 'micro' }),
        });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.pendingUpgrade).toBeDefined();
        expect(result.pendingUpgrade.newTier).toBe('small');
    });
    test('pendingUpgrade undefined when within tier bounds', async () => {
        const { service } = buildService({
            clientCount: 15,
            subscription: makeSubscription({ tier: 'small' }),
        });
        const result = await service.getSubscriptionStatus(PARTNER_ID);
        expect(result.pendingUpgrade).toBeUndefined();
    });
});
describe('SubscriptionService — getEffectiveStatus', () => {
    test('active subscription returns active', async () => {
        const { service } = buildService({ subscription: makeSubscription({ status: 'active' }) });
        const status = await service.getEffectiveStatus(PARTNER_ID);
        expect(status).toBe('active');
    });
    test('cancelled subscription returns cancelled', async () => {
        const { service } = buildService({ subscription: makeSubscription({ status: 'cancelled' }) });
        expect(await service.getEffectiveStatus(PARTNER_ID)).toBe('cancelled');
    });
    test('trial within trial period returns trial', async () => {
        const { service } = buildService({
            subscription: makeSubscription({
                status: 'trial',
                trial_ends_at: new Date(Date.now() + 5 * MS_PER_DAY),
            }),
        });
        expect(await service.getEffectiveStatus(PARTNER_ID)).toBe('trial');
    });
    test('trial past trial_ends_at but within grace returns grace', async () => {
        const trialEnd = new Date(Date.now() - 2 * MS_PER_DAY);
        const { service } = buildService({
            subscription: makeSubscription({
                status: 'trial',
                trial_ends_at: trialEnd,
                grace_period_ends_at: new Date(Date.now() + 5 * MS_PER_DAY),
            }),
        });
        expect(await service.getEffectiveStatus(PARTNER_ID)).toBe('grace');
    });
    test('trial past grace period returns overdue', async () => {
        const { service } = buildService({
            subscription: makeSubscription({
                status: 'trial',
                trial_ends_at: new Date(Date.now() - 10 * MS_PER_DAY),
                grace_period_ends_at: new Date(Date.now() - 2 * MS_PER_DAY),
            }),
        });
        expect(await service.getEffectiveStatus(PARTNER_ID)).toBe('overdue');
    });
    test('no subscription row returns trial (first-time)', async () => {
        const { service } = buildService({ subscription: null });
        expect(await service.getEffectiveStatus(PARTNER_ID)).toBe('trial');
    });
});
describe('SubscriptionService — cancelSubscription', () => {
    test('updates status to cancelled', async () => {
        const { service, subscriptionRepo } = buildService({ subscription: makeSubscription() });
        await service.cancelSubscription(PARTNER_ID);
        expect(subscriptionRepo.repository.update).toHaveBeenCalledWith('sub-uuid-1', expect.objectContaining({ status: 'cancelled' }));
    });
    test('throws NotFoundException when no subscription', async () => {
        const { service } = buildService({ subscription: null });
        await expect(service.cancelSubscription(PARTNER_ID)).rejects.toThrow(common_1.NotFoundException);
    });
    test('is idempotent — does not update if already cancelled', async () => {
        const { service, subscriptionRepo } = buildService({
            subscription: makeSubscription({ status: 'cancelled' }),
        });
        await service.cancelSubscription(PARTNER_ID);
        expect(subscriptionRepo.repository.update).not.toHaveBeenCalled();
    });
});
describe('SubscriptionService — changePlan', () => {
    test('updates plan_type', async () => {
        const { service, subscriptionRepo } = buildService({ subscription: makeSubscription({ plan_type: 'monthly' }) });
        await service.changePlan(PARTNER_ID, 'annual');
        expect(subscriptionRepo.repository.update).toHaveBeenCalledWith('sub-uuid-1', { plan_type: 'annual' });
    });
    test('no-op when plan already matches', async () => {
        const { service, subscriptionRepo } = buildService({ subscription: makeSubscription({ plan_type: 'annual' }) });
        await service.changePlan(PARTNER_ID, 'annual');
        expect(subscriptionRepo.repository.update).not.toHaveBeenCalled();
    });
});
describe('SubscriptionService — processPaymentWebhook', () => {
    test('confirms payment and activates subscription', async () => {
        const { service, invoiceRepo, subscriptionRepo } = buildService({
            invoice: makeInvoice({ amount_vnd: new decimal_js_1.Decimal('600000') }),
        });
        const result = await service.processPaymentWebhook({
            provider: 'manual',
            partner_id: PARTNER_ID,
            invoice_id: 'inv-uuid-1',
            amount_vnd: 600000,
        });
        expect(result.processed).toBe(true);
        expect(invoiceRepo.repository.update).toHaveBeenCalledWith('inv-uuid-1', expect.objectContaining({ status: 'paid' }));
        expect(subscriptionRepo.repository.update).toHaveBeenCalledWith({ partner_id: PARTNER_ID }, expect.objectContaining({ status: 'active' }));
    });
    test('rejects when amount does not match', async () => {
        const { service } = buildService({
            invoice: makeInvoice({ amount_vnd: new decimal_js_1.Decimal('600000') }),
        });
        const result = await service.processPaymentWebhook({
            provider: 'manual',
            partner_id: PARTNER_ID,
            amount_vnd: 500000,
        });
        expect(result.processed).toBe(false);
        expect(result.message).toContain('Amount mismatch');
    });
    test('rejects when no pending invoice found', async () => {
        const { service } = buildService({ invoice: null });
        const result = await service.processPaymentWebhook({
            provider: 'manual',
            partner_id: PARTNER_ID,
            amount_vnd: 600000,
        });
        expect(result.processed).toBe(false);
        expect(result.message).toContain('No matching');
    });
});
test('triggerQuarterlyUpgradeCheck resolves without throwing', async () => {
    const { service } = buildService();
    await expect(service.triggerQuarterlyUpgradeCheck()).resolves.toBeUndefined();
});
//# sourceMappingURL=subscription.service.spec.js.map