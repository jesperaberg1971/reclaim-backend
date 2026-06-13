"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PdfProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const pdf_service_1 = require("../pdf/pdf.service");
const branding_service_1 = require("../branding/branding.service");
const queue_constants_1 = require("./queue.constants");
let PdfProcessor = PdfProcessor_1 = class PdfProcessor extends bullmq_1.WorkerHost {
    constructor(dataSource, pdfService, brandingService) {
        super();
        this.dataSource = dataSource;
        this.pdfService = pdfService;
        this.brandingService = brandingService;
        this.logger = new common_1.Logger(PdfProcessor_1.name);
    }
    async process(job) {
        const { expenseId, tenantId, expense, tripRow } = job.data;
        const attempt = (job.attemptsMade ?? 0) + 1;
        const maxAttempts = job.opts.attempts ?? 4;
        const isLast = attempt >= maxAttempts;
        this.logger.log(`[PDF] start job=${job.id} expense=${expenseId} tenant=${tenantId} attempt=${attempt}/${maxAttempts}`);
        try {
            await this.generateAndAttach(expenseId, tenantId, expense, tripRow);
            this.logger.log(`[PDF] done  job=${job.id} expense=${expenseId}`);
        }
        catch (err) {
            this.logger.error(`[PDF] FAILED job=${job.id} expense=${expenseId} attempt=${attempt}/${maxAttempts}: ${err.message}`, err.stack);
            if (isLast) {
                await this.storePdfFailureMarker(expenseId, tenantId, err.message);
            }
            throw err;
        }
    }
    async generateAndAttach(expenseId, tenantId, expenseData, tripData) {
        const { empRow, clientRow, existingDocs } = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [[emp], [client], [current]] = await Promise.all([
                manager.query(`SELECT full_name, employee_id FROM employees WHERE id = $1`, [expenseData.employee_id]),
                manager.query(`SELECT name, partner_id FROM clients WHERE id = $1`, [expenseData.client_id]),
                manager.query(`SELECT supporting_documents FROM expenses WHERE id = $1`, [expenseId]),
            ]);
            return { empRow: emp, clientRow: client, existingDocs: current?.supporting_documents ?? [] };
        });
        if (existingDocs.some((d) => d.type === 'trip_decision_pdf' && d.status === 'generated')) {
            this.logger.log(`[PDF] PDF already exists for expense ${expenseId} — skipping`);
            return;
        }
        let logoUrl = null;
        let primaryColor = null;
        let reportFooter = null;
        if (clientRow?.partner_id) {
            try {
                const branding = await this.brandingService.getBranding(clientRow.partner_id);
                logoUrl = branding.logo_url;
                primaryColor = branding.primary_color !== '#1a56db' ? branding.primary_color : null;
                reportFooter = branding.report_footer;
            }
            catch {
            }
        }
        const ref = await this.pdfService.generateTripDecisionPdf({
            decisionNumber: String(Math.floor(Math.random() * 900) + 100),
            companyName: clientRow?.name ?? 'Công ty',
            employeeFullName: empRow?.full_name ?? 'Nhân viên',
            employeeInternalId: empRow?.employee_id ?? expenseData.employee_id.slice(0, 8),
            destination: tripData.destination || 'Theo lịch công tác được phê duyệt',
            purpose: tripData.purpose || 'Công tác theo yêu cầu kinh doanh',
            startDate: new Date(tripData.start_date),
            endDate: new Date(tripData.end_date),
            dailyAllowanceVnd: new decimal_js_1.Decimal(tripData.daily_allowance_amount),
            logoUrl, primaryColor, reportFooter,
        });
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [current] = await manager.query(`SELECT supporting_documents FROM expenses WHERE id = $1`, [expenseId]);
            const docs = (current?.supporting_documents ?? []).filter((d) => !(d.type === 'trip_decision_pdf' && d.status === 'queued'));
            docs.push(ref);
            await manager.query(`UPDATE expenses SET supporting_documents = $1 WHERE id = $2`, [JSON.stringify(docs), expenseId]);
        });
        this.logger.log(`[PDF] attached ${ref.filename} to expense ${expenseId}`);
    }
    async storePdfFailureMarker(expenseId, tenantId, errorMessage) {
        try {
            await this.dataSource.transaction(async (manager) => {
                await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
                const [current] = await manager.query(`SELECT supporting_documents FROM expenses WHERE id = $1`, [expenseId]);
                const docs = (current?.supporting_documents ?? []).filter((d) => !(d.type === 'trip_decision_pdf' && d.status === 'queued'));
                docs.push({
                    type: 'trip_decision_pdf',
                    status: 'failed',
                    error_message: errorMessage,
                    failed_at: new Date().toISOString(),
                });
                await manager.query(`UPDATE expenses SET supporting_documents = $1 WHERE id = $2`, [JSON.stringify(docs), expenseId]);
            });
        }
        catch (markerErr) {
            this.logger.error(`[PDF] could not store failure marker for ${expenseId}: ${markerErr.message}`);
        }
    }
};
exports.PdfProcessor = PdfProcessor;
exports.PdfProcessor = PdfProcessor = PdfProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.PDF_GENERATION_QUEUE, { concurrency: 2 }),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        pdf_service_1.PdfService,
        branding_service_1.BrandingService])
], PdfProcessor);
//# sourceMappingURL=pdf.processor.js.map