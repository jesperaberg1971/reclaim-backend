import { Decimal } from 'decimal.js';
export declare class OcrResultDto {
    date: Date;
    amount: Decimal;
    vendorName: string;
    paymentMethod: 'cash' | 'card' | 'unknown';
    cardLast4?: string;
    confidence: number;
    needsHumanReview: boolean;
}
