export declare class PaymentWebhookDto {
    provider: string;
    provider_reference?: string;
    invoice_id?: string;
    partner_id: string;
    amount_vnd: number;
    note?: string;
}
