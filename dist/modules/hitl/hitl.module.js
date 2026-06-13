"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HitlModule = void 0;
const common_1 = require("@nestjs/common");
const hitl_controller_1 = require("./hitl.controller");
const hitl_service_1 = require("./hitl.service");
const receipt_module_1 = require("../receipt/receipt.module");
const redis_module_1 = require("../../common/redis/redis.module");
const storage_module_1 = require("../../common/storage/storage.module");
let HitlModule = class HitlModule {
};
exports.HitlModule = HitlModule;
exports.HitlModule = HitlModule = __decorate([
    (0, common_1.Module)({
        imports: [receipt_module_1.ReceiptModule, redis_module_1.RedisModule, storage_module_1.StorageModule],
        controllers: [hitl_controller_1.HitlController],
        providers: [hitl_service_1.HitlService],
    })
], HitlModule);
//# sourceMappingURL=hitl.module.js.map