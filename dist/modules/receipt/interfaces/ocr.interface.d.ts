import { Decimal } from 'decimal.js';
export interface OcrResult {
    date: Date;
    amount: Decimal;
    vendorName: string;
    paymentMethod: 'cash' | 'card' | 'unknown';
    cardLast4?: string;
}
