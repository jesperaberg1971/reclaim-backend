"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const ocr_processor_1 = require("./ocr.processor");
const ocr_module_1 = require("../ocr/ocr.module");
const redis_module_1 = require("../../common/redis/redis.module");
const receipt_module_1 = require("../receipt/receipt.module");
const queue_constants_1 = require("./queue.constants");
const redis_config_1 = require("../../common/redis/redis-config");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: (0, redis_config_1.parseRedisConfig)(config),
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: { type: 'exponential', delay: 5000 },
                        removeOnComplete: { count: 100 },
                        removeOnFail: { count: 50 },
                    },
                }),
            }),
            bullmq_1.BullModule.registerQueue({ name: queue_constants_1.OCR_QUEUE }),
            ocr_module_1.OcrModule,
            redis_module_1.RedisModule,
            receipt_module_1.ReceiptModule,
        ],
        providers: [ocr_processor_1.OcrProcessor],
        exports: [bullmq_1.BullModule],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map