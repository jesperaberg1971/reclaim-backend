import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryJobData } from './dto/webhook.dto';
export declare class WebhookProcessor extends WorkerHost {
    private readonly webhookService;
    private readonly logger;
    constructor(webhookService: WebhookService);
    process(job: Job<WebhookDeliveryJobData>): Promise<void>;
}
