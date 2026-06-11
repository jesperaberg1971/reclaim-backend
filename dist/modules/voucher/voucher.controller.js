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
var VoucherController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const voucher_service_1 = require("./voucher.service");
const audit_service_1 = require("../../common/audit/audit.service");
let VoucherController = VoucherController_1 = class VoucherController {
    constructor(voucherService, auditService) {
        this.voucherService = voucherService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(VoucherController_1.name);
    }
    async downloadVoucher(expenseId, req, res) {
        const voucherData = await this.voucherService.generateVoucherData(expenseId, req.user.tenantId);
        const pdfBuffer = await this.voucherService.generatePdfBuffer(voucherData);
        this.logger.log(`Voucher ${voucherData.voucherNumber} downloaded`);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            action: 'voucher_download',
            resourceType: 'expense',
            resourceId: expenseId,
            metadata: { voucherNumber: voucherData.voucherNumber },
        });
        res.end(pdfBuffer);
    }
};
exports.VoucherController = VoucherController;
__decorate([
    (0, common_1.Get)(':expenseId/download'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename=voucher.pdf'),
    __param(0, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], VoucherController.prototype, "downloadVoucher", null);
exports.VoucherController = VoucherController = VoucherController_1 = __decorate([
    (0, common_1.Controller)('voucher'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __metadata("design:paramtypes", [voucher_service_1.VoucherService,
        audit_service_1.AuditService])
], VoucherController);
//# sourceMappingURL=voucher.controller.js.map