import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { OcrService } from '../ocr/ocr.service';
import { RedisService } from '../../common/redis/redis.service';
import { ReceiptProcessingService } from '../receipt/receipt-processing.service';
import { OcrJobData } from './dto/ocr-job.dto';
export declare class OcrProcessor extends WorkerHost {
    private readonly ocrService;
    private readonly redisService;
    private readonly receiptProcessingService;
    private readonly dataSource;
    private readonly logger;
    constructor(ocrService: OcrService, redisService: RedisService, receiptProcessingService: ReceiptProcessingService, dataSource: DataSource);
    process(job: Job<OcrJobData>): Promise<void>;
    private handleOcrError;
    private failPermanently;
    private updateExpense;
}
