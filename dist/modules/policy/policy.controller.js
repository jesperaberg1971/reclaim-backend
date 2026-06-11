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
exports.PolicyController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const policy_service_1 = require("./policy.service");
const update_policy_dto_1 = require("./dto/update-policy.dto");
const set_client_policy_dto_1 = require("./dto/set-client-policy.dto");
const policy_html_1 = require("./policy.html");
const policy_print_html_1 = require("./policy-print.html");
let PolicyController = class PolicyController {
    constructor(service) {
        this.service = service;
    }
    dashboard(res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send((0, policy_html_1.buildPolicyHtml)());
    }
    getPolicy(req) {
        return this.service.getPolicy(req.user.tenantId);
    }
    updatePolicy(req, dto) {
        return this.service.updatePolicy(req.user.tenantId, req.user.userId, dto);
    }
    getHistory(req) {
        return this.service.getPolicyHistory(req.user.tenantId);
    }
    async exportPolicy(req) {
        const { partner_name, policy, effective_since } = await this.service.getPolicy(req.user.tenantId);
        return {
            schema_version: '2.0',
            exported_at: new Date().toISOString(),
            partner_name,
            effective_since,
            policy,
            labels: {
                meal_cap_vnd: 'Trần chi phí bữa ăn / biên lai (VND)',
                per_diem_daily_vnd: 'Phụ cấp công tác / ngày (VND)',
                welfare_monthly_cap_vnd: 'Hạn mức phúc lợi / tháng / nhân viên (VND)',
                personal_card_limit_vnd: 'Hạn mức hoàn ứng thẻ cá nhân (VND)',
                allowed_categories: 'Loại chi phí được phép (rỗng = tất cả)',
                require_original_receipt: 'Yêu cầu biên lai gốc',
            },
            gate_mapping: {
                meal_cap_vnd: ['Gate 1 — Công tác phí', 'Gate 2 — Phúc lợi (meal sub-cap)'],
                per_diem_daily_vnd: ['Gate 1 — Công tác phí (default for new trip decisions)'],
                welfare_monthly_cap_vnd: ['Gate 2 — Phúc lợi nhân viên'],
                personal_card_limit_vnd: ['Gate 3 — Hoàn ứng thẻ cá nhân'],
                allowed_categories: ['All gates — category allow-list'],
                require_original_receipt: ['All gates — pre-processing check'],
            },
        };
    }
    async printPolicy(req, res) {
        const data = await this.service.getPolicy(req.user.tenantId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send((0, policy_print_html_1.buildPolicyPrintHtml)(data));
    }
    getVersions(req) {
        return this.service.getPolicyVersions(req.user.tenantId);
    }
    getVersion(req, n) {
        return this.service.getPolicyVersion(req.user.tenantId, n);
    }
    restoreVersion(req, n) {
        return this.service.restorePolicyVersion(req.user.tenantId, req.user.userId, n);
    }
    listClientPolicies(req) {
        return this.service.listClientPolicies(req.user.tenantId);
    }
    getClientPolicy(req, clientId) {
        return this.service.getClientPolicy(req.user.tenantId, clientId);
    }
    setClientPolicy(req, clientId, dto) {
        return this.service.setClientPolicy(req.user.tenantId, req.user.userId, clientId, dto);
    }
    deleteClientPolicy(req, clientId) {
        return this.service.deleteClientPolicy(req.user.tenantId, clientId, req.user.userId);
    }
};
exports.PolicyController = PolicyController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_policy_dto_1.UpdatePolicyDto]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "updatePolicy", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "exportPolicy", null);
__decorate([
    (0, common_1.Get)('print'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PolicyController.prototype, "printPolicy", null);
__decorate([
    (0, common_1.Get)('versions'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Get)('version/:n'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('n', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Post)('version/:n/restore'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('n', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "restoreVersion", null);
__decorate([
    (0, common_1.Get)('clients'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "listClientPolicies", null);
__decorate([
    (0, common_1.Get)('client/:clientId'),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('clientId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "getClientPolicy", null);
__decorate([
    (0, common_1.Put)('client/:clientId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('clientId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, set_client_policy_dto_1.SetClientPolicyDto]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "setClientPolicy", null);
__decorate([
    (0, common_1.Delete)('client/:clientId'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('clientId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PolicyController.prototype, "deleteClientPolicy", null);
exports.PolicyController = PolicyController = __decorate([
    (0, common_1.Controller)('policy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __metadata("design:paramtypes", [policy_service_1.PolicyService])
], PolicyController);
//# sourceMappingURL=policy.controller.js.map