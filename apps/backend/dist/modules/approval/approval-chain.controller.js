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
exports.ApprovalChainController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const approval_chain_service_1 = require("./approval-chain.service");
const approval_action_dto_1 = require("./dto/approval-action.dto");
const bulk_action_dto_1 = require("./dto/bulk-action.dto");
let ApprovalChainController = class ApprovalChainController {
    constructor(service) {
        this.service = service;
    }
    getPendingQueue(req) {
        return this.service.getPendingQueue(req.user.tenantId, req.user.role, req.user.clientId);
    }
    getChain(req, expenseId) {
        return this.service.getChain(expenseId, req.user.tenantId);
    }
    approve(req, expenseId, dto) {
        return this.service.approveStep(expenseId, req.user.tenantId, req.user.userId, req.user.role, dto.note);
    }
    reject(req, expenseId, dto) {
        return this.service.rejectStep(expenseId, req.user.tenantId, req.user.userId, req.user.role, dto.note);
    }
    bulkApprove(req, dto) {
        return this.service.bulkApprove(dto.expenseIds, req.user.tenantId, req.user.userId, req.user.role, dto.note);
    }
    bulkReject(req, dto) {
        return this.service.bulkReject(dto.expenseIds, req.user.tenantId, req.user.userId, req.user.role, dto.note);
    }
};
exports.ApprovalChainController = ApprovalChainController;
__decorate([
    (0, common_1.Get)('queue'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "getPendingQueue", null);
__decorate([
    (0, common_1.Get)(':expenseId'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "getChain", null);
__decorate([
    (0, common_1.Post)(':expenseId/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':expenseId/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('bulk-approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_action_dto_1.BulkActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "bulkApprove", null);
__decorate([
    (0, common_1.Post)('bulk-reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_action_dto_1.BulkActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalChainController.prototype, "bulkReject", null);
exports.ApprovalChainController = ApprovalChainController = __decorate([
    (0, common_1.Controller)('approval'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin', 'client_admin'),
    __metadata("design:paramtypes", [approval_chain_service_1.ApprovalChainService])
], ApprovalChainController);
//# sourceMappingURL=approval-chain.controller.js.map