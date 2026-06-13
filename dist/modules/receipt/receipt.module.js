"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_cls_1 = require("nestjs-cls");
const redis_module_1 = require("../../common/redis/redis.module");
const receipt_processing_service_1 = require("./receipt-processing.service");
const expense_repository_1 = require("./repositories/expense.repository");
const trip_decision_repository_1 = require("./repositories/trip-decision.repository");
const partner_repository_1 = require("./repositories/partner.repository");
const expense_entity_1 = require("../../database/entities/expense.entity");
const trip_decision_entity_1 = require("../../database/entities/trip-decision.entity");
const partner_entity_1 = require("../../database/entities/partner.entity");
const welfare_balance_entity_1 = require("../../database/entities/welfare-balance.entity");
const employee_bank_account_entity_1 = require("../../database/entities/employee-bank-account.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const queue_constants_1 = require("../queue/queue.constants");
let ReceiptModule = class ReceiptModule {
};
exports.ReceiptModule = ReceiptModule;
exports.ReceiptModule = ReceiptModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([expense_entity_1.Expense, trip_decision_entity_1.TripDecision, partner_entity_1.Partner, welfare_balance_entity_1.WelfareBalance, employee_bank_account_entity_1.EmployeeBankAccount]),
            bullmq_1.BullModule.registerQueue({ name: queue_constants_1.PDF_GENERATION_QUEUE }),
            nestjs_cls_1.ClsModule,
            redis_module_1.RedisModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [
            receipt_processing_service_1.ReceiptProcessingService,
            expense_repository_1.ExpenseRepository,
            trip_decision_repository_1.TripDecisionRepository,
            partner_repository_1.PartnerRepository,
        ],
        exports: [
            receipt_processing_service_1.ReceiptProcessingService,
            expense_repository_1.ExpenseRepository,
            trip_decision_repository_1.TripDecisionRepository,
            partner_repository_1.PartnerRepository
        ],
    })
], ReceiptModule);
//# sourceMappingURL=receipt.module.js.map