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
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const jwt = require("jsonwebtoken");
const public_decorator_1 = require("../../common/decorators/public.decorator");
function effectiveStatus(row) {
    const now = Date.now();
    if (row.status === 'cancelled')
        return 'cancelled';
    if (row.status === 'overdue')
        return 'overdue';
    if (row.status === 'active')
        return 'active';
    if (row.status === 'trial') {
        const trialEnd = row.trial_ends_at ? new Date(row.trial_ends_at).getTime() : Infinity;
        if (now <= trialEnd)
            return 'trial';
        const graceEnd = row.grace_period_ends_at
            ? new Date(row.grace_period_ends_at).getTime()
            : trialEnd + 7 * 86_400_000;
        return now <= graceEnd ? 'grace' : 'overdue';
    }
    if (row.status === 'grace') {
        const graceEnd = row.grace_period_ends_at
            ? new Date(row.grace_period_ends_at).getTime()
            : now - 1;
        return now <= graceEnd ? 'grace' : 'overdue';
    }
    return row.status;
}
let SubscriptionGuard = class SubscriptionGuard {
    constructor(dataSource, reflector) {
        this.dataSource = dataSource;
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic)
            return true;
        const req = ctx.switchToHttp().getRequest();
        const urlPath = (req.path ?? req.url ?? '');
        if (urlPath.startsWith('/api/subscription') ||
            urlPath.startsWith('/subscription') ||
            urlPath.startsWith('/api/auth') ||
            urlPath.startsWith('/auth'))
            return true;
        const authHeader = req.headers?.authorization;
        if (!authHeader?.startsWith('Bearer '))
            return true;
        const token = authHeader.slice(7);
        let payload;
        try {
            payload = jwt.decode(token);
        }
        catch {
            return true;
        }
        if (!payload || typeof payload !== 'object')
            return true;
        if (payload.role === 'super_admin')
            return true;
        const tenantId = payload.tenantId;
        if (!tenantId)
            return true;
        const rows = await this.dataSource.query(`SELECT status, trial_ends_at, grace_period_ends_at
       FROM subscriptions WHERE partner_id = $1 LIMIT 1`, [tenantId]);
        if (!rows.length)
            return true;
        const status = effectiveStatus(rows[0]);
        if (status === 'overdue' || status === 'cancelled') {
            throw new common_1.ForbiddenException('Subscription inactive. Visit /api/subscription/billing to renew.');
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        core_1.Reflector])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map