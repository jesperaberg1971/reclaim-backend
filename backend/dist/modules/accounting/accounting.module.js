"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingModule = void 0;
const common_1 = require("@nestjs/common");
const accounting_controller_1 = require("./accounting.controller");
const accounting_service_1 = require("./accounting.service");
const comments_service_1 = require("./comments.service");
const notifications_module_1 = require("../notifications/notifications.module");
const redis_module_1 = require("../../common/redis/redis.module");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, redis_module_1.RedisModule],
        controllers: [accounting_controller_1.AccountingController],
        providers: [accounting_service_1.AccountingService, comments_service_1.CommentsService],
        exports: [comments_service_1.CommentsService],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map