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
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const trip_decision_template_1 = require("./templates/trip-decision.template");
const invoice_template_1 = require("./templates/invoice.template");
const file_storage_service_1 = require("../../common/storage/file-storage.service");
let PdfService = PdfService_1 = class PdfService {
    constructor(config, fileStorageService) {
        this.config = config;
        this.fileStorageService = fileStorageService;
        this.logger = new common_1.Logger(PdfService_1.name);
    }
    async generateInvoicePdf(data) {
        const filename = `${data.invoiceNumber.replace(/\//g, '-')}.pdf`;
        const key = `invoices/${filename}`;
        const html = (0, invoice_template_1.buildInvoiceHtml)(data);
        const pdf = await this.renderPdf(html);
        const url = await this.fileStorageService.saveFile(key, pdf, 'application/pdf');
        this.logger.log(`Invoice PDF generated: ${filename} (${pdf.length} bytes)`);
        return { type: 'invoice_pdf', url, filename, generated_at: new Date().toISOString() };
    }
    async generateTripDecisionPdf(data) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const filename = `TD-${year}-${month}-${(0, crypto_1.randomUUID)().slice(0, 8)}.pdf`;
        const key = `trip-decisions/${filename}`;
        const html = (0, trip_decision_template_1.buildTripDecisionHtml)(data);
        const pdf = await this.renderPdf(html);
        const url = await this.fileStorageService.saveFile(key, pdf, 'application/pdf');
        this.logger.log(`Trip Decision PDF generated: ${filename} (${pdf.length} bytes)`);
        return { type: 'trip_decision_pdf', url, filename, generated_at: new Date().toISOString() };
    }
    async renderPdf(html) {
        const puppeteer = await Promise.resolve().then(() => require('puppeteer')).catch(() => null);
        if (!puppeteer) {
            this.logger.warn('Puppeteer not available — generating placeholder PDF');
            return this.placeholderPdf();
        }
        const browser = await puppeteer.default.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none',
            ],
        });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });
            return Buffer.from(pdf);
        }
        finally {
            await browser.close();
        }
    }
    placeholderPdf() {
        const content = [
            '%PDF-1.4',
            '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
            '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
            '3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj',
            'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n',
            'trailer<</Size 4/Root 1 0 R>>',
            'startxref\n190',
            '%%EOF',
        ].join('\n');
        return Buffer.from(content, 'ascii');
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        file_storage_service_1.FileStorageService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map