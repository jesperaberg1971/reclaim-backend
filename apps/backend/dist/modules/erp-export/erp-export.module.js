"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpExportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const erp_export_service_1 = require("./erp-export.service");
const erp_export_controller_1 = require("./erp-export.controller");
const webhook_service_1 = require("./webhook.service");
const webhook_processor_1 = require("./webhook.processor");
const batch_export_processor_1 = require("./batch-export.processor");
const receipt_module_1 = require("../receipt/receipt.module");
const redis_module_1 = require("../../common/redis/redis.module");
const expense_entity_1 = require("../../database/entities/expense.entity");
const queue_constants_1 = require("../queue/queue.constants");
let ErpExportModule = class ErpExportModule {
};
exports.ErpExportModule = ErpExportModule;
exports.ErpExportModule = ErpExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([expense_entity_1.Expense]),
            receipt_module_1.ReceiptModule,
            redis_module_1.RedisModule,
            bullmq_1.BullModule.registerQueue({ name: queue_constants_1.WEBHOOK_DELIVERY_QUEUE }, { name: queue_constants_1.BATCH_EXPORT_QUEUE }),
        ],
        controllers: [erp_export_controller_1.ErpExportController],
        providers: [erp_export_service_1.ErpExportService, webhook_service_1.WebhookService, webhook_processor_1.WebhookProcessor, batch_export_processor_1.BatchExportProcessor],
    })
], ErpExportModule);
//# sourceMappingURL=erp-export.module.js.map