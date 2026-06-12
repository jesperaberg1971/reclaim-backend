import { Decimal } from 'decimal.js';
export interface InvoicePdfData {
    invoiceNumber: string;
    partnerName: string;
    partnerTaxCode: string;
    issuedAt: Date;
    dueDate: Date;
    periodStart: Date;
    periodEnd: Date;
    tier: string;
    planType: 'monthly' | 'annual';
    monthlyPriceVnd: Decimal;
    discountPercentage: number;
    amountVnd: Decimal;
    status: 'pending' | 'paid' | 'void';
    logoUrl?: string | null;
    company_display_name?: string | null;
}
export declare function buildInvoiceHtml(data: InvoicePdfData): string;
