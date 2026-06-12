import { Decimal } from 'decimal.js';
export declare class BillingTier {
    id: string;
    tier: string;
    min_clients: number;
    max_clients: number;
    monthly_price_vnd: Decimal;
}
