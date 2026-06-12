export type SpendingGroupBy = 'category' | 'employee' | 'gate' | 'period';
export declare class SpendingQueryDto {
    from: string;
    to: string;
    clientId?: string;
    groupBy?: SpendingGroupBy;
}
export declare class PerformanceQueryDto {
    from: string;
    to: string;
    clientId?: string;
}
export declare class ReportExportQueryDto {
    from: string;
    to: string;
    clientId?: string;
    type: string;
    groupBy?: SpendingGroupBy;
}
