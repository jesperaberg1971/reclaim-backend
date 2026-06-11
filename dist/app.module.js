"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const database_module_1 = require("./database/database.module");
const receipt_module_1 = require("./modules/receipt/receipt.module");
const mobile_module_1 = require("./modules/mobile/mobile.module");
const redis_module_1 = require("./common/redis/redis.module");
const ocr_module_1 = require("./modules/ocr/ocr.module");
const auth_module_1 = require("./modules/auth/auth.module");
const partner_module_1 = require("./modules/partner/partner.module");
const client_module_1 = require("./modules/client/client.module");
const subscription_module_1 = require("./modules/subscription/subscription.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const erp_export_module_1 = require("./modules/erp-export/erp-export.module");
const voucher_module_1 = require("./modules/voucher/voucher.module");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const audit_middleware_1 = require("./common/middleware/audit.middleware");
const rls_interceptor_1 = require("./common/interceptors/rls.interceptor");
const audit_module_1 = require("./common/audit/audit.module");
const monitoring_module_1 = require("./modules/monitoring/monitoring.module");
const queue_module_1 = require("./modules/queue/queue.module");
const hitl_module_1 = require("./modules/hitl/hitl.module");
const accounting_module_1 = require("./modules/accounting/accounting.module");
const setup_module_1 = require("./modules/setup/setup.module");
const files_module_1 = require("./modules/files/files.module");
const policy_module_1 = require("./modules/policy/policy.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const approval_chain_module_1 = require("./modules/approval/approval-chain.module");
const admin_module_1 = require("./modules/admin/admin.module");
const import_module_1 = require("./modules/import/import.module");
const feedback_module_1 = require("./modules/feedback/feedback.module");
const pdpd_module_1 = require("./modules/pdpd/pdpd.module");
const branding_module_1 = require("./modules/branding/branding.module");
const i18n_module_1 = require("./modules/i18n/i18n.module");
const subscription_guard_1 = require("./modules/subscription/subscription.guard");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(audit_middleware_1.AuditMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            audit_module_1.AuditModule,
            throttler_1.ThrottlerModule.forRoot([
                { name: 'burst', ttl: 1_000, limit: 20 },
                { name: 'sustained', ttl: 60_000, limit: 200 },
            ]),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            ocr_module_1.OcrModule,
            queue_module_1.QueueModule,
            auth_module_1.AuthModule,
            receipt_module_1.ReceiptModule,
            mobile_module_1.MobileModule,
            partner_module_1.PartnerModule,
            client_module_1.ClientModule,
            subscription_module_1.SubscriptionModule,
            attendance_module_1.AttendanceModule,
            erp_export_module_1.ErpExportModule,
            voucher_module_1.VoucherModule,
            hitl_module_1.HitlModule,
            accounting_module_1.AccountingModule,
            setup_module_1.SetupModule,
            monitoring_module_1.MonitoringModule,
            files_module_1.FilesModule,
            policy_module_1.PolicyModule,
            notifications_module_1.NotificationsModule,
            approval_chain_module_1.ApprovalChainModule,
            admin_module_1.AdminModule,
            import_module_1.ImportModule,
            feedback_module_1.FeedbackModule,
            pdpd_module_1.PdpdModule,
            branding_module_1.BrandingModule,
            i18n_module_1.I18nModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: rls_interceptor_1.RlsInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: subscription_guard_1.SubscriptionGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map