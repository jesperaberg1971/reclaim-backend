import { ConfigService } from '@nestjs/config';
import { TripDecisionPdfData } from './templates/trip-decision.template';
import { InvoicePdfData } from './templates/invoice.template';
import { FileStorageService } from '../../common/storage/file-storage.service';
export { TripDecisionPdfData, InvoicePdfData };
export interface StoredPdfRef {
    type: 'trip_decision_pdf' | 'invoice_pdf';
    status: 'generated';
    url: string;
    filename: string;
    generated_at: string;
}
export declare class PdfService {
    private readonly config;
    private readonly fileStorageService;
    private readonly logger;
    constructor(config: ConfigService, fileStorageService: FileStorageService);
    generateInvoicePdf(data: InvoicePdfData): Promise<StoredPdfRef>;
    generateTripDecisionPdf(data: TripDecisionPdfData): Promise<StoredPdfRef>;
    private renderPdf;
    private placeholderPdf;
}
