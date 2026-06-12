import { DataSource } from 'typeorm';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { InvoiceRepository } from './repositories/invoice.repository';
import { PaymentWebhookRepository } from './repositories/payment-webhook.repository';
import { PartnerRepository } from '../receipt/repositories/partner.repository';
import { SubscriptionStatusDto } from './dto/subscription-status.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { SubscriptionStatus, PlanType } from '../../database/entities/subscription.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { PdfService } from '../pdf/pdf.service';
import { ConfigService } from '@nestjs/config';
export declare class SubscriptionService {
    private readonly subscriptionRepo;
    private readonly partnerRepo;
    private readonly invoiceRepo;
    private readonly webhookRepo;
    private readonly pdfService;
    private readonly configService;
    private readonly dataSource;
    private readonly logger;
    constructor(subscriptionRepo: SubscriptionRepository, partnerRepo: PartnerRepository, invoiceRepo: InvoiceRepository, webhookRepo: PaymentWebhookRepository, pdfService: PdfService, configService: ConfigService, dataSource: DataSource);
    private getTierAndPrice;
    private getMaxClientsForTier;
    private computeEffectiveStatus;
    getEffectiveStatus(partnerId: string): Promise<SubscriptionStatus>;
    getSubscriptionStatus(partnerId: string): Promise<SubscriptionStatusDto>;
    changePlan(partnerId: string, planType: PlanType): Promise<void>;
    cancelSubscription(partnerId: string): Promise<void>;
    reactivateSubscription(partnerId: string): Promise<{
        invoice: Invoice;
    }>;
    generateInvoice(partnerId: string): Promise<Invoice>;
    private buildAndAttachPdf;
    listInvoices(partnerId: string): Promise<Invoice[]>;
    getInvoice(invoiceId: string, partnerId: string): Promise<Invoice>;
    processPaymentWebhook(dto: PaymentWebhookDto): Promise<{
        processed: boolean;
        message: string;
    }>;
    triggerQuarterlyUpgradeCheck(): Promise<void>;
    private requireSubscription;
}
