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
exports.BrandingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const branding_service_1 = require("./branding.service");
let BrandingController = class BrandingController {
    constructor(brandingService) {
        this.brandingService = brandingService;
    }
    async getOwnBranding(req) {
        const partnerId = req.user.partnerId ?? req.query.partner_id;
        return this.brandingService.getBranding(partnerId);
    }
    async updateOwnBranding(req, dto) {
        return this.brandingService.updateBranding(req.user.partnerId, dto);
    }
    async getBrandingById(partnerId) {
        return this.brandingService.getBranding(partnerId);
    }
    async updateBrandingById(partnerId, dto) {
        return this.brandingService.updateBranding(partnerId, dto);
    }
    async getPublicBranding(partnerId) {
        const b = await this.brandingService.getBranding(partnerId);
        return {
            logo_url: b.logo_url,
            primary_color: b.primary_color,
            accent_color: b.accent_color,
            company_display_name: b.company_display_name,
        };
    }
    async getCss(partnerId, res) {
        const b = await this.brandingService.getBranding(partnerId);
        res.send(this.brandingService.buildCssVars(b));
    }
};
exports.BrandingController = BrandingController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "getOwnBranding", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, branding_service_1.UpdateBrandingDto]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "updateOwnBranding", null);
__decorate([
    (0, common_1.Get)('partner/:partnerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "getBrandingById", null);
__decorate([
    (0, common_1.Put)('partner/:partnerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, branding_service_1.UpdateBrandingDto]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "updateBrandingById", null);
__decorate([
    (0, common_1.Get)('public/:partnerId'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "getPublicBranding", null);
__decorate([
    (0, common_1.Get)('css/:partnerId'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/css; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600'),
    __param(0, (0, common_1.Param)('partnerId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "getCss", null);
exports.BrandingController = BrandingController = __decorate([
    (0, common_1.Controller)('branding'),
    __metadata("design:paramtypes", [branding_service_1.BrandingService])
], BrandingController);
//# sourceMappingURL=branding.controller.js.map