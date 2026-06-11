export declare class BulkActionDto {
    expenseIds: string[];
    note?: string;
}
export interface BulkActionResult {
    succeeded: string[];
    failed: {
        expenseId: string;
        error: string;
    }[];
}
