import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ErpExportService } from './erp-export.service';
import { WebhookService } from './webhook.service';
import { RedisService } from '../../common/redis/redis.service';
import { BatchExportJobData } from './dto/webhook.dto';
export declare class BatchExportProcessor extends WorkerHost {
    private readonly erpService;
    private readonly webhookService;
    private readonly redisService;
    private readonly logger;
    constructor(erpService: ErpExportService, webhookService: WebhookService, redisService: RedisService);
    process(job: Job<BatchExportJobData>): Promise<void>;
}
