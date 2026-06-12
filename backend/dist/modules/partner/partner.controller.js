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
exports.PartnerController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const partner_service_1 = require("./partner.service");
const partner_dto_1 = require("./dto/partner.dto");
const partner_html_1 = require("./partner.html");
let PartnerController = class PartnerController {
    constructor(partnerService) {
        this.partnerService = partnerService;
    }
    getPortal() {
        return (0, partner_html_1.buildPartnerPortalHtml)();
    }
    getDashboard(req) {
        return this.partnerService.getDashboard(req.user.partnerId);
    }
    listClients(req) {
        return this.partnerService.listClients(req.user.partnerId);
    }
    createClient(req, dto) {
        return this.partnerService.createClient(req.user.partnerId, dto);
    }
    updateClient(id, req, dto) {
        return this.partnerService.updateClient(id, req.user.partnerId, dto);
    }
    listEmployees(req, clientId) {
        return this.partnerService.listEmployees(req.user.partnerId, clientId);
    }
    createEmployee(req, dto) {
        return this.partnerService.createEmployee(req.user.partnerId, dto);
    }
    updateEmployee(id, req, dto) {
        return this.partnerService.updateEmployee(id, req.user.partnerId, dto);
    }
    getReports(req, query) {
        return this.partnerService.getReports(req.user.partnerId, query);
    }
    async testRls(req) {
        const clients = await this.partnerService.listClients(req.user.partnerId);
        return {
            message: 'RLS active — you only see clients belonging to your tenant.',
            count: clients.length,
            clients,
        };
    }
};
exports.PartnerController = PartnerController;
__decorate([
    (0, common_1.Get)('portal'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "getPortal", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "listClients", null);
__decorate([
    (0, common_1.Post)('clients'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_dto_1.CreateClientDto]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "createClient", null);
__decorate([
    (0, common_1.Patch)('clients/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, partner_dto_1.UpdateClientDto]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Get)('employees'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('client_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "listEmployees", null);
__decorate([
    (0, common_1.Post)('employees'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "createEmployee", null);
__decorate([
    (0, common_1.Patch)('employees/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, partner_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "updateEmployee", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, partner_dto_1.PartnerReportQueryDto]),
    __metadata("design:returntype", void 0)
], PartnerController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('test-rls'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PartnerController.prototype, "testRls", null);
exports.PartnerController = PartnerController = __decorate([
    (0, common_1.Controller)('partner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [partner_service_1.PartnerService])
], PartnerController);
//# sourceMappingURL=partner.controller.js.map