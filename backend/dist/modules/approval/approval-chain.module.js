"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalChainModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const approval_chain_controller_1 = require("./approval-chain.controller");
const approval_chain_service_1 = require("./approval-chain.service");
const escalation_service_1 = require("./escalation.service");
const escalation_processor_1 = require("./escalation.processor");
const notifications_module_1 = require("../notifications/notifications.module");
const queue_constants_1 = require("../queue/queue.constants");
let ApprovalChainModule = class ApprovalChainModule {
};
exports.ApprovalChainModule = ApprovalChainModule;
exports.ApprovalChainModule = ApprovalChainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            notifications_module_1.NotificationsModule,
            bullmq_1.BullModule.registerQueue({ name: queue_constants_1.APPROVAL_ESCALATION_QUEUE }),
        ],
        controllers: [approval_chain_controller_1.ApprovalChainController],
        providers: [approval_chain_service_1.ApprovalChainService, escalation_service_1.EscalationService, escalation_processor_1.EscalationProcessor],
        exports: [approval_chain_service_1.ApprovalChainService],
    })
], ApprovalChainModule);
//# sourceMappingURL=approval-chain.module.js.map