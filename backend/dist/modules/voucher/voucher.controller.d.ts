import { Response } from 'express';
import { VoucherService } from './voucher.service';
import { AuditService } from '../../common/audit/audit.service';
export declare class VoucherController {
    private readonly voucherService;
    private readonly auditService;
    private readonly logger;
    constructor(voucherService: VoucherService, auditService: AuditService);
    downloadVoucher(expenseId: string, req: any, res: Response): Promise<void>;
}
