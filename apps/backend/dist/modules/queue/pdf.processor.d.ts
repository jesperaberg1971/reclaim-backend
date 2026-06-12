import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { PdfService } from '../pdf/pdf.service';
import { BrandingService } from '../branding/branding.service';
import { PdfJobData } from './dto/pdf-job.dto';
export declare class PdfProcessor extends WorkerHost {
    private readonly dataSource;
    private readonly pdfService;
    private readonly brandingService;
    private readonly logger;
    constructor(dataSource: DataSource, pdfService: PdfService, brandingService: BrandingService);
    process(job: Job<PdfJobData>): Promise<void>;
    private generateAndAttach;
    private storePdfFailureMarker;
}
