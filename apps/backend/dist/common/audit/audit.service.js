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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let AuditService = AuditService_1 = class AuditService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(event) {
        try {
            await this.dataSource.query(`INSERT INTO audit_logs
           (tenant_id, user_id, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`, [
                event.tenantId ?? null,
                event.userId ?? null,
                event.action,
                event.resourceType ?? null,
                event.resourceId ?? null,
                event.ipAddress ?? null,
                event.metadata ? JSON.stringify(event.metadata) : null,
            ]);
        }
        catch (err) {
            this.logger.error(`Audit write failed for action=${event.action}: ${err.message}`);
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AuditService);
//# sourceMappingURL=audit.service.js.map