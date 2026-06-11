import { Partner } from './partner.entity';
import { Subscription } from './subscription.entity';
import { Decimal } from 'decimal.js';
export type InvoiceStatus = 'pending' | 'paid' | 'void';
export declare class Invoice {
    id: string;
    partner: Partner;
    partner_id: string;
    subscription: Subscription | null;
    subscription_id: string | null;
    invoice_number: string;
    period_start: Date;
    period_end: Date;
    amount_vnd: Decimal;
    status: InvoiceStatus;
    due_date: Date;
    paid_at: Date | null;
    pdf_path: string | null;
    created_at: Date;
}
