"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantScopeGuard = void 0;
const common_1 = require("@nestjs/common");
let TenantScopeGuard = class TenantScopeGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        switch (user.role) {
            case 'partner_admin':
                if (!user.partnerId) {
                    throw new common_1.ForbiddenException('Partner admin must have partnerId in JWT');
                }
                break;
            case 'client_admin':
                if (!user.clientId) {
                    throw new common_1.ForbiddenException('Client admin must have clientId in JWT');
                }
                break;
            case 'employee':
                if (!user.employeeId) {
                    throw new common_1.ForbiddenException('Employee must have employeeId in JWT');
                }
                break;
            default:
                throw new common_1.ForbiddenException('Invalid user role');
        }
        return true;
    }
};
exports.TenantScopeGuard = TenantScopeGuard;
exports.TenantScopeGuard = TenantScopeGuard = __decorate([
    (0, common_1.Injectable)()
], TenantScopeGuard);
//# sourceMappingURL=tenant-scope.guard.js.map