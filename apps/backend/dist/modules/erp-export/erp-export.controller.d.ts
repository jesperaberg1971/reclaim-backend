import { Response } from 'express';
import { AuditService } from '../../common/audit/audit.service';
import { ErpExportService } from './erp-export.service';
import { WebhookService } from './webhook.service';
import { ExportRequestDto } from './dto/export-request.dto';
import { StructuredExportRequestDto } from './dto/structured-export-request.dto';
import { RegisterWebhookDto } from './dto/webhook.dto';
export declare class ErpExportController {
    private readonly erpExportService;
    private readonly webhookService;
    private readonly auditService;
    private readonly logger;
    constructor(erpExportService: ErpExportService, webhookService: WebhookService, auditService: AuditService);
    export(req: any, dto: ExportRequestDto): Promise<{
        success: boolean;
        exportedCount: number;
        erpType: "MISA" | "BIZZI" | "SAP";
        payload: any;
    }>;
    structuredExport(dto: StructuredExportRequestDto, req: any): Promise<import("./erp-export.service").ExportPackage>;
    misaCsvExport(dto: StructuredExportRequestDto, req: any, res: Response): Promise<void>;
    startBatchExport(req: any, dto: StructuredExportRequestDto): Promise<{
        jobId: string;
        status: "queued";
    }>;
    getBatchExportStatus(req: any, jobId: string): Promise<import("./dto/webhook.dto").BatchJobState>;
    registerWebhook(req: any, dto: RegisterWebhookDto): Promise<import("./dto/webhook.dto").WebhookEndpoint & {
        secret: string;
    }>;
    listWebhooks(req: any): Promise<import("./dto/webhook.dto").WebhookEndpoint[]>;
    deleteWebhook(req: any, id: string): Promise<{
        ok: boolean;
        deleted: string;
    }>;
    getWebhookDeliveries(req: any, id: string): Promise<import("./dto/webhook.dto").WebhookDelivery[]>;
}
