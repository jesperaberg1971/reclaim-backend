import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripDecisionPdfData } from './templates/trip-decision.template';
import { InvoicePdfData } from './templates/invoice.template';
export { TripDecisionPdfData, InvoicePdfData };
export interface StoredPdfRef {
    type: 'trip_decision_pdf' | 'invoice_pdf';
    url: string;
    filename: string;
    generated_at: string;
}
export declare class PdfService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly tripDecisionsDir;
    private readonly invoicesDir;
    constructor(config: ConfigService);
    onModuleInit(): void;
    generateInvoicePdf(data: InvoicePdfData): Promise<StoredPdfRef>;
    generateTripDecisionPdf(data: TripDecisionPdfData): Promise<StoredPdfRef>;
    private renderPdf;
    private placeholderPdf;
}
