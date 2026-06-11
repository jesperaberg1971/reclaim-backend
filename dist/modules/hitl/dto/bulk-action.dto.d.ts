export declare enum BulkActionType {
    APPROVE = "approve",
    REJECT = "reject"
}
export declare class BulkActionDto {
    expenseIds: string[];
    action: BulkActionType;
    reviewer_notes?: string;
}
