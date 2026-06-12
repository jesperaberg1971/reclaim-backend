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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RlsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const typeorm_1 = require("typeorm");
const nestjs_cls_1 = require("nestjs-cls");
let RlsInterceptor = class RlsInterceptor {
    constructor(dataSource, cls) {
        this.dataSource = dataSource;
        this.cls = cls;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return next.handle();
        }
        if (user.role === 'super_admin') {
            return (0, rxjs_1.from)(this.dataSource.transaction(async (manager) => {
                this.cls.set('transactionalEntityManager', manager);
                await manager.query(`SELECT set_config('app.is_super_admin', 'true', true)`);
                return (0, rxjs_2.lastValueFrom)(next.handle());
            }));
        }
        if (!user.tenantId) {
            throw new common_1.ForbiddenException('Missing tenantId claim in JWT');
        }
        return (0, rxjs_1.from)(this.dataSource.transaction(async (manager) => {
            this.cls.set('transactionalEntityManager', manager);
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [user.tenantId]);
            return (0, rxjs_2.lastValueFrom)(next.handle());
        }));
    }
};
exports.RlsInterceptor = RlsInterceptor;
exports.RlsInterceptor = RlsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        nestjs_cls_1.ClsService])
], RlsInterceptor);
//# sourceMappingURL=rls.interceptor.js.map