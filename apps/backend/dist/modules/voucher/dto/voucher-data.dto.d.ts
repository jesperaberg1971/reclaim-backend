import { Decimal } from 'decimal.js';
export declare class VoucherDataDto {
    voucherNumber: string;
    date: Date;
    employeeName: string;
    employeeId: string;
    amountVnd: Decimal;
    reason: string;
    gateApplied: 3;
    receiptImageUrl: string;
    approverName?: string;
}
