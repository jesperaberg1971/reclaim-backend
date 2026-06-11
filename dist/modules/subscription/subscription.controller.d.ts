import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
export declare class SubscriptionController {
    private readonly subscriptionService;
    private readonly configService;
    constructor(subscriptionService: SubscriptionService, configService: ConfigService);
    getBillingPage(): string;
    getStatus(req: any): Promise<import("./dto/subscription-status.dto").SubscriptionStatusDto>;
    changePlan(req: any, dto: ChangePlanDto): Promise<{
        message: string;
    }>;
    cancel(req: any): Promise<{
        message: string;
    }>;
    reactivate(req: any): Promise<{
        message: string;
        invoice: import("../../database/entities").Invoice;
    }>;
    listInvoices(req: any): Promise<import("../../database/entities").Invoice[]>;
    getInvoice(id: string, req: any): Promise<import("../../database/entities").Invoice>;
    createInvoice(req: any): Promise<import("../../database/entities").Invoice>;
    paymentWebhook(dto: PaymentWebhookDto, secret: string): Promise<{
        processed: boolean;
        message: string;
    }>;
    adminGenerateInvoice(partnerId: string): Promise<import("../../database/entities").Invoice>;
    adminListInvoices(partnerId: string): Promise<import("../../database/entities").Invoice[]>;
}
