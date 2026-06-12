"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileModule = void 0;
const common_1 = require("@nestjs/common");
const mobile_controller_1 = require("./mobile.controller");
const mobile_service_1 = require("./mobile.service");
const queue_module_1 = require("../queue/queue.module");
const receipt_module_1 = require("../receipt/receipt.module");
const redis_module_1 = require("../../common/redis/redis.module");
const storage_module_1 = require("../../common/storage/storage.module");
let MobileModule = class MobileModule {
};
exports.MobileModule = MobileModule;
exports.MobileModule = MobileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            queue_module_1.QueueModule,
            receipt_module_1.ReceiptModule,
            redis_module_1.RedisModule,
            storage_module_1.StorageModule,
        ],
        controllers: [mobile_controller_1.MobileController],
        providers: [mobile_service_1.MobileService],
    })
], MobileModule);
//# sourceMappingURL=mobile.module.js.map