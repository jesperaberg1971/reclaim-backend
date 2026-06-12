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
exports.PdpdController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const pdpd_service_1 = require("./pdpd.service");
let PdpdController = class PdpdController {
    constructor(pdpdService) {
        this.pdpdService = pdpdService;
    }
    async exportData(employeeId, req) {
        return this.pdpdService.exportEmployeeData(employeeId, req.user.partnerId ?? null, req.user.userId, req.user.role, req.ip);
    }
    async withdrawConsent(employeeId, req) {
        return this.pdpdService.withdrawConsent(employeeId, req.user.partnerId ?? null, req.user.userId, req.user.role, req.ip);
    }
    async recordConsent(employeeId, req) {
        return this.pdpdService.recordConsentGiven(employeeId, req.user.partnerId ?? null, req.user.userId, req.user.role, req.ip);
    }
    async getConsentLog(employeeId, req) {
        return this.pdpdService.getConsentLog(employeeId, req.user.partnerId ?? null, req.user.role);
    }
};
exports.PdpdController = PdpdController;
__decorate([
    (0, common_1.Get)('export/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PdpdController.prototype, "exportData", null);
__decorate([
    (0, common_1.Delete)('consent/:employeeId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PdpdController.prototype, "withdrawConsent", null);
__decorate([
    (0, common_1.Post)('consent/:employeeId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PdpdController.prototype, "recordConsent", null);
__decorate([
    (0, common_1.Get)('consent-log/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PdpdController.prototype, "getConsentLog", null);
exports.PdpdController = PdpdController = __decorate([
    (0, common_1.Controller)('pdpd'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin', 'super_admin'),
    __metadata("design:paramtypes", [pdpd_service_1.PdpdService])
], PdpdController);
//# sourceMappingURL=pdpd.controller.js.map