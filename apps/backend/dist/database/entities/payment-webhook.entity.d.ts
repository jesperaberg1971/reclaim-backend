import { Partner } from './partner.entity';
import { Invoice } from './invoice.entity';
import { Decimal } from 'decimal.js';
export type WebhookStatus = 'pending' | 'confirmed' | 'rejected';
export declare class PaymentWebhook {
    id: string;
    provider: string;
    provider_reference: string | null;
    partner: Partner | null;
    partner_id: string | null;
    invoice: Invoice | null;
    invoice_id: string | null;
    amount_vnd: Decimal;
    status: WebhookStatus;
    raw_payload: Record<string, unknown>;
    processed_at: Date | null;
    created_at: Date;
}
