import { MobileService } from './mobile.service';
export declare class MobileController {
    private readonly mobileService;
    constructor(mobileService: MobileService);
    uploadReceipt(file: Express.Multer.File | undefined, employeeId: string, idempotencyKey: string | undefined, req: any): Promise<{
        expenseId: string;
        status: import("../../database/entities").ExpenseStatus;
        user_message: string;
        receipt_image_url: string;
        receipt_image_signed_url: string | null;
    }>;
    uploadReceiptsBatch(files: Express.Multer.File[] | undefined, employeeId: string, idempotencyKeysRaw: string | string[] | undefined, req: any): Promise<import("./mobile.service").BatchUploadResponse>;
    listExpenses(since?: string, status?: string, employeeId?: string, limitRaw?: string, offsetRaw?: string, req?: any): Promise<import("./mobile.service").ExpenseListResponse>;
    getProfile(req: any): Promise<{
        employeeId: string | null;
        fullName: string | null;
    }>;
    getStatus(expenseId: string, req: any): Promise<import("./mobile.service").StatusResponse>;
}
