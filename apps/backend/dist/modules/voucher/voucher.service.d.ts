import { ExpenseRepository } from '../receipt/repositories/expense.repository';
import { VoucherDataDto } from './dto/voucher-data.dto';
export declare class VoucherService {
    private readonly expenseRepo;
    private readonly logger;
    constructor(expenseRepo: ExpenseRepository);
    generateVoucherData(expenseId: string, tenantId: string): Promise<VoucherDataDto>;
    generatePdfBuffer(voucherData: VoucherDataDto): Promise<Buffer>;
}
