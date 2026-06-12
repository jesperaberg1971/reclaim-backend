import { DataSource } from 'typeorm';
import { AuditService } from '../../common/audit/audit.service';
export interface ParsedCSV {
    headers: string[];
    rows: Record<string, string>[];
}
export interface RowError {
    row: number;
    field: string;
    message: string;
}
export interface ExpenseImportResult {
    total: number;
    imported: number;
    skipped: number;
    dry_run: boolean;
    errors: RowError[];
}
export interface TenantProvisionResult {
    total: number;
    succeeded: number;
    failed: number;
    results: {
        row: number;
        name: string;
        status: 'ok' | 'error';
        message?: string;
    }[];
}
export declare const EXPENSE_CSV_TEMPLATE: string;
export declare const TENANT_CSV_TEMPLATE: string;
export declare class ImportService {
    private readonly dataSource;
    private readonly auditService;
    private readonly logger;
    constructor(dataSource: DataSource, auditService: AuditService);
    parseCSV(text: string): ParsedCSV;
    private parseCSVLine;
    private parseDate;
    private parseAmount;
    importExpenses(partnerId: string, fileBuffer: Buffer, opts?: {
        dry_run?: boolean;
    }): Promise<ExpenseImportResult>;
    bulkProvisionTenants(fileBuffer: Buffer, adminUserId: string): Promise<TenantProvisionResult>;
    private provisionOneTenant;
}
