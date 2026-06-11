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
exports.MobileGuideController = exports.SetupController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const setup_service_1 = require("./setup.service");
const setup_dto_1 = require("./dto/setup.dto");
const provision_dto_1 = require("./dto/provision.dto");
const invite_dto_1 = require("./dto/invite.dto");
const setup_html_1 = require("./setup.html");
const mobile_guide_html_1 = require("../mobile/mobile-guide.html");
let SetupController = class SetupController {
    constructor(setupService) {
        this.setupService = setupService;
    }
    getWizard() {
        return (0, setup_html_1.buildSetupHtml)();
    }
    createPartner(dto) {
        return this.setupService.createPartner(dto);
    }
    provision(dto) {
        return this.setupService.provision(dto);
    }
    redeemInvite(dto) {
        return this.setupService.redeemInvite(dto);
    }
    createClient(dto, req) {
        return this.setupService.createClient(req.user.tenantId, dto);
    }
    createClientAdmin(dto, req) {
        return this.setupService.createClientAdmin(req.user.tenantId, dto);
    }
    createEmployee(dto, req) {
        return this.setupService.createEmployee(req.user.tenantId, dto);
    }
    bulkImportEmployees(dto, req) {
        return this.setupService.bulkImportEmployees(req.user.tenantId, dto);
    }
    createInvite(dto, req) {
        return this.setupService.createInvite(req.user.tenantId, dto);
    }
    getChecklist(req) {
        return this.setupService.getChecklist(req.user.tenantId);
    }
};
exports.SetupController = SetupController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "getWizard", null);
__decorate([
    (0, common_1.Post)('partner'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_dto_1.CreatePartnerDto]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "createPartner", null);
__decorate([
    (0, common_1.Post)('provision'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [provision_dto_1.ProvisionDto]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "provision", null);
__decorate([
    (0, common_1.Post)('redeem-invite'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_dto_1.RedeemInviteDto]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "redeemInvite", null);
__decorate([
    (0, common_1.Post)('client'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_dto_1.CreateClientDto, Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "createClient", null);
__decorate([
    (0, common_1.Post)('client-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_dto_1.CreateClientAdminDto, Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "createClientAdmin", null);
__decorate([
    (0, common_1.Post)('employee'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_dto_1.CreateEmployeeDto, Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Post)('bulk-employees'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_dto_1.BulkImportDto, Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "bulkImportEmployees", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_dto_1.CreateInviteDto, Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "createInvite", null);
__decorate([
    (0, common_1.Get)('checklist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_scope_guard_1.TenantScopeGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SetupController.prototype, "getChecklist", null);
exports.SetupController = SetupController = __decorate([
    (0, common_1.Controller)('setup'),
    __metadata("design:paramtypes", [setup_service_1.SetupService])
], SetupController);
let MobileGuideController = class MobileGuideController {
    getGuide(res) {
        res.send((0, mobile_guide_html_1.buildMobileGuideHtml)());
    }
};
exports.MobileGuideController = MobileGuideController;
__decorate([
    (0, common_1.Get)('guide'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MobileGuideController.prototype, "getGuide", null);
exports.MobileGuideController = MobileGuideController = __decorate([
    (0, common_1.Controller)('mobile')
], MobileGuideController);
//# sourceMappingURL=setup.controller.js.map