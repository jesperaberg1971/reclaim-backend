export type WebhookEventType = 'export.completed' | 'export.batch.completed';
export declare const WEBHOOK_EVENTS: readonly WebhookEventType[];
export declare class RegisterWebhookDto {
    url: string;
    events: WebhookEventType[];
}
export interface WebhookEndpoint {
    id: string;
    url: string;
    events: WebhookEventType[];
    is_active: boolean;
    created_at: string;
}
export interface WebhookDelivery {
    id: string;
    event: string;
    status: 'pending' | 'delivered' | 'failed';
    response_status: number | null;
    attempts: number;
    last_attempted_at: string | null;
    created_at: string;
}
export interface WebhookPayload<T = unknown> {
    id: string;
    event: WebhookEventType;
    timestamp: string;
    tenant_id: string;
    data: T;
}
export interface ExportCompletedData {
    export_format: 'structured_v2' | 'misa_csv' | 'legacy';
    expense_count: number;
    total_deductible_vnd: string;
    period: {
        from: string;
        to: string;
    };
    marked_as_exported: boolean;
}
export interface BatchExportCompletedData extends ExportCompletedData {
    job_id: string;
}
export interface BatchJobState {
    status: 'queued' | 'processing' | 'completed' | 'failed';
    tenant_id: string;
    job_id: string;
    queued_at: string;
    started_at?: string;
    completed_at?: string;
    failed_at?: string;
    error?: string;
    metadata?: Record<string, unknown>;
    summary?: Record<string, unknown>;
    validation_report?: Record<string, unknown>;
}
export interface WebhookDeliveryJobData {
    deliveryId: string;
    url: string;
    secret: string;
    payloadJson: string;
}
export interface BatchExportJobData {
    tenantId: string;
    jobId: string;
    dto: {
        from: string;
        to: string;
        clientId?: string;
        mark_exported?: boolean;
    };
}
