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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const import_service_1 = require("./import.service");
const import_html_1 = require("./import.html");
const ALLOWED_CSV_TYPES = new Set([
    'text/csv', 'text/plain', 'application/csv',
    'application/vnd.ms-excel', 'application/octet-stream',
]);
const csvUpload = {
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ext !== 'csv' || !ALLOWED_CSV_TYPES.has(file.mimetype)) {
            return cb(new common_1.BadRequestException('Chỉ chấp nhận file .csv'), false);
        }
        cb(null, true);
    },
};
let ImportController = class ImportController {
    constructor(importService) {
        this.importService = importService;
    }
    getPage() {
        return (0, import_html_1.buildImportHtml)();
    }
    getExpenseTemplate(res) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="reclaim_expense_template.csv"');
        res.send('﻿' + import_service_1.EXPENSE_CSV_TEMPLATE);
    }
    getTenantTemplate(res) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="reclaim_tenant_template.csv"');
        res.send('﻿' + import_service_1.TENANT_CSV_TEMPLATE);
    }
    async importExpenses(file, req) {
        if (!file)
            throw new common_1.BadRequestException('Vui lòng tải file CSV');
        const dryRun = String(req.query?.dry_run ?? req.body?.dry_run ?? '') === 'true';
        return this.importService.importExpenses(req.user.partnerId, file.buffer, { dry_run: dryRun });
    }
    async bulkProvisionTenants(file, req) {
        if (!file)
            throw new common_1.BadRequestException('Vui lòng tải file CSV');
        return this.importService.bulkProvisionTenants(file.buffer, req.user.userId);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Get)('page'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "getPage", null);
__decorate([
    (0, common_1.Get)('template/expenses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "getExpenseTemplate", null);
__decorate([
    (0, common_1.Get)('template/tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "getTenantTemplate", null);
__decorate([
    (0, common_1.Post)('expenses'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', csvUpload)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importExpenses", null);
__decorate([
    (0, common_1.Post)('tenants'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', csvUpload)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "bulkProvisionTenants", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map