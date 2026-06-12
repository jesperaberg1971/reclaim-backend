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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const admin_service_1 = require("./admin.service");
const admin_query_dto_1 = require("./dto/admin-query.dto");
const admin_html_1 = require("./admin.html");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getDashboard() {
        return (0, admin_html_1.buildAdminDashboardHtml)();
    }
    listTenants(query) {
        return this.adminService.listTenants(query);
    }
    createTenant(dto, req) {
        return this.adminService.createTenant(dto, req.user.userId);
    }
    getTenant(id) {
        return this.adminService.getTenant(id);
    }
    updateTenant(id, dto, req) {
        return this.adminService.updateTenant(id, dto, req.user.userId);
    }
    getTenantUsage(id) {
        return this.adminService.getTenantUsage(id);
    }
    bulkActionTenants(dto, req) {
        return this.adminService.bulkActionTenants(dto, req.user.userId);
    }
    provisionTenant(dto, req) {
        return this.adminService.provisionTenant(dto, req.user.userId);
    }
    listUsers(query) {
        return this.adminService.listUsers(query);
    }
    createAdminUser(dto, req) {
        return this.adminService.createAdminUser(dto, req.user.userId);
    }
    updateUser(id, dto, req) {
        return this.adminService.updateUser(id, dto, req.user.userId);
    }
    adminResetPassword(id, dto, req) {
        return this.adminService.adminResetPassword(id, dto.newPassword, req.user.userId);
    }
    bulkActionUsers(dto, req) {
        return this.adminService.bulkActionUsers(dto, req.user.userId);
    }
    getAuditLogs(query) {
        return this.adminService.getAuditLogs(query);
    }
    getAnalytics(query) {
        return this.adminService.getAnalytics(query);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.ListTenantsQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listTenants", null);
__decorate([
    (0, common_1.Post)('tenants'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.CreateTenantDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Get)('tenants/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Patch)('tenants/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_query_dto_1.UpdateTenantDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateTenant", null);
__decorate([
    (0, common_1.Get)('tenants/:id/usage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTenantUsage", null);
__decorate([
    (0, common_1.Post)('tenants/bulk'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.BulkTenantActionDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "bulkActionTenants", null);
__decorate([
    (0, common_1.Post)('tenants/provision'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.ProvisionTenantDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "provisionTenant", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.ListUsersQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('users/admin'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.CreateAdminUserDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createAdminUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_query_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_query_dto_1.AdminResetPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "adminResetPassword", null);
__decorate([
    (0, common_1.Post)('users/bulk'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.BulkUserActionDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "bulkActionUsers", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.AuditLogQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.AdminAnalyticsQueryDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAnalytics", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map