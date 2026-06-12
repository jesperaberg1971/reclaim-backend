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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ErpExportController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpExportController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const audit_service_1 = require("../../common/audit/audit.service");
const erp_export_service_1 = require("./erp-export.service");
const webhook_service_1 = require("./webhook.service");
const export_request_dto_1 = require("./dto/export-request.dto");
const structured_export_request_dto_1 = require("./dto/structured-export-request.dto");
const webhook_dto_1 = require("./dto/webhook.dto");
let ErpExportController = ErpExportController_1 = class ErpExportController {
    constructor(erpExportService, webhookService, auditService) {
        this.erpExportService = erpExportService;
        this.webhookService = webhookService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(ErpExportController_1.name);
    }
    async export(req, dto) {
        const tenantId = req.user.tenantId;
        const result = await this.erpExportService.exportToErp(tenantId, dto);
        this.logger.log(`ERP export: ${result.exportedCount} expenses → ${dto.erpType}`);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'erp_export',
            metadata: { erpType: dto.erpType, exported_count: result.exportedCount },
        });
        return result;
    }
    async structuredExport(dto, req) {
        const tenantId = req.user.tenantId;
        const pkg = await this.erpExportService.generateStructuredExport(tenantId, dto);
        this.logger.log(`Structured export v2: ${pkg.metadata.expense_count} expenses | ` +
            `${pkg.metadata.total_deductible_vnd} VND | ` +
            `valid=${pkg.validation_report.valid} errors=${pkg.validation_report.error_count} | ` +
            `period ${dto.from} → ${dto.to}`);
        void this.auditService.log({
            tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'erp_export',
            metadata: {
                format: 'structured_v2',
                from: dto.from, to: dto.to,
                expense_count: pkg.metadata.expense_count,
                mark_exported: dto.mark_exported !== false,
            },
        });
        return pkg;
    }
    async misaCsvExport(dto, req, res) {
        const tenantId = req.user.tenantId;
        const csv = await this.erpExportService.generateMisaCsv(tenantId, dto);
        const filename = `reclaim-misa-${dto.from}-${dto.to}.csv`;
        this.logger.log(`MISA CSV export: period ${dto.from} → ${dto.to} (tenant=${tenantId})`);
        void this.auditService.log({
            tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'misa_csv_export',
            metadata: { from: dto.from, to: dto.to },
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('﻿' + csv);
    }
    async startBatchExport(req, dto) {
        const result = await this.erpExportService.startBatchExport(req.user.tenantId, dto);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'erp_export',
            metadata: { format: 'batch', from: dto.from, to: dto.to, job_id: result.jobId },
        });
        return result;
    }
    async getBatchExportStatus(req, jobId) {
        const state = await this.erpExportService.getBatchExportStatus(req.user.tenantId, jobId);
        if (!state)
            throw new common_1.NotFoundException(`Batch export job ${jobId} not found`);
        return state;
    }
    async registerWebhook(req, dto) {
        const endpoint = await this.webhookService.registerEndpoint(req.user.tenantId, dto);
        this.logger.log(`Webhook registered: ${dto.url} (tenant=${req.user.tenantId})`);
        return endpoint;
    }
    async listWebhooks(req) {
        return this.webhookService.listEndpoints(req.user.tenantId);
    }
    async deleteWebhook(req, id) {
        await this.webhookService.deleteEndpoint(req.user.tenantId, id);
        return { ok: true, deleted: id };
    }
    async getWebhookDeliveries(req, id) {
        return this.webhookService.getDeliveries(req.user.tenantId, id);
    }
};
exports.ErpExportController = ErpExportController;
__decorate([
    (0, common_1.Post)('export'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, export_request_dto_1.ExportRequestDto]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('export/structured'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [structured_export_request_dto_1.StructuredExportRequestDto, Object]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "structuredExport", null);
__decorate([
    (0, common_1.Get)('export/misa-csv'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [structured_export_request_dto_1.StructuredExportRequestDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "misaCsvExport", null);
__decorate([
    (0, common_1.Post)('export/batch'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, structured_export_request_dto_1.StructuredExportRequestDto]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "startBatchExport", null);
__decorate([
    (0, common_1.Get)('export/batch/:jobId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "getBatchExportStatus", null);
__decorate([
    (0, common_1.Post)('webhooks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, webhook_dto_1.RegisterWebhookDto]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "registerWebhook", null);
__decorate([
    (0, common_1.Get)('webhooks'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "listWebhooks", null);
__decorate([
    (0, common_1.Delete)('webhooks/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)('webhooks/:id/deliveries'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ErpExportController.prototype, "getWebhookDeliveries", null);
exports.ErpExportController = ErpExportController = ErpExportController_1 = __decorate([
    (0, common_1.Controller)('erp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_scope_guard_1.TenantScopeGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __metadata("design:paramtypes", [erp_export_service_1.ErpExportService,
        webhook_service_1.WebhookService,
        audit_service_1.AuditService])
], ErpExportController);
//# sourceMappingURL=erp-export.controller.js.map