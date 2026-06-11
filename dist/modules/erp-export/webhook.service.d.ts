import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { RegisterWebhookDto, WebhookEndpoint, WebhookDelivery, WebhookEventType } from './dto/webhook.dto';
export declare class WebhookService {
    private readonly dataSource;
    private readonly deliveryQueue;
    private readonly logger;
    constructor(dataSource: DataSource, deliveryQueue: Queue);
    registerEndpoint(tenantId: string, dto: RegisterWebhookDto): Promise<WebhookEndpoint & {
        secret: string;
    }>;
    listEndpoints(tenantId: string): Promise<WebhookEndpoint[]>;
    deleteEndpoint(tenantId: string, endpointId: string): Promise<void>;
    getDeliveries(tenantId: string, endpointId: string, limit?: number): Promise<WebhookDelivery[]>;
    fireEvent<T>(tenantId: string, event: WebhookEventType, data: T): Promise<void>;
    updateDeliveryStatus(deliveryId: string, status: 'delivered' | 'failed', responseStatus: number | null, responseBody: string | null): Promise<void>;
    private toEndpoint;
    private toDelivery;
}
