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
exports.HitlController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const hitl_service_1 = require("./hitl.service");
const ocr_correction_dto_1 = require("./dto/ocr-correction.dto");
const bulk_action_dto_1 = require("./dto/bulk-action.dto");
const reject_reason_dto_1 = require("./dto/reject-reason.dto");
const admin_html_1 = require("./admin.html");
const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
let HitlController = class HitlController {
    constructor(hitlService) {
        this.hitlService = hitlService;
    }
    async adminScreen(res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send((0, admin_html_1.buildAdminHtml)());
    }
    async getQueue(req) {
        return this.hitlService.getQueue(req.user.tenantId);
    }
    async bulkAction(dto, req) {
        return this.hitlService.bulkAction(dto.expenseIds, dto.action, req.user.tenantId, dto.reviewer_notes, req.user.userId, req.ip);
    }
    async getDetail(expenseId, req) {
        return this.hitlService.getDetail(expenseId, req.user.tenantId);
    }
    async getOcrMetrics(period) {
        if (period !== undefined && !PERIOD_RE.test(period)) {
            throw new common_1.BadRequestException('period must be in YYYY-MM format');
        }
        return this.hitlService.getOcrMetrics(period);
    }
    async applyCorrection(expenseId, dto, req) {
        return this.hitlService.applyCorrection(expenseId, req.user.tenantId, dto, req.user.userId, req.ip);
    }
    async rejectExpense(expenseId, dto, req) {
        await this.hitlService.rejectExpense(expenseId, req.user.tenantId, dto.reason, req.user.userId, req.ip);
        return { expenseId, status: 'rejected' };
    }
};
exports.HitlController = HitlController;
__decorate([
    (0, common_1.Get)('review'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "adminScreen", null);
__decorate([
    (0, common_1.Get)('queue'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)('bulk-action'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_action_dto_1.BulkActionDto, Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "bulkAction", null);
__decorate([
    (0, common_1.Get)('queue/:expenseId'),
    __param(0, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Get)('ocr-metrics'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "getOcrMetrics", null);
__decorate([
    (0, common_1.Post)('queue/:expenseId/correct'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ocr_correction_dto_1.OcrCorrectionDto, Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "applyCorrection", null);
__decorate([
    (0, common_1.Post)('queue/:expenseId/reject'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reject_reason_dto_1.RejectReasonDto, Object]),
    __metadata("design:returntype", Promise)
], HitlController.prototype, "rejectExpense", null);
exports.HitlController = HitlController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __metadata("design:paramtypes", [hitl_service_1.HitlService])
], HitlController);
//# sourceMappingURL=hitl.controller.js.map