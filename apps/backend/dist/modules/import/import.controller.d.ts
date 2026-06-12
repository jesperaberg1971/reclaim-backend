import { Response } from 'express';
import { ImportService } from './import.service';
export declare class ImportController {
    private readonly importService;
    constructor(importService: ImportService);
    getPage(): string;
    getExpenseTemplate(res: Response): void;
    getTenantTemplate(res: Response): void;
    importExpenses(file: Express.Multer.File, req: any): Promise<import("./import.service").ExpenseImportResult>;
    bulkProvisionTenants(file: Express.Multer.File, req: any): Promise<import("./import.service").TenantProvisionResult>;
}
