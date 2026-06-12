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
var EscalationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const queue_constants_1 = require("../queue/queue.constants");
let EscalationService = EscalationService_1 = class EscalationService {
    constructor(queue) {
        this.queue = queue;
        this.logger = new common_1.Logger(EscalationService_1.name);
    }
    async onModuleInit() {
        const existing = await this.queue.getRepeatableJobs();
        for (const job of existing) {
            await this.queue.removeRepeatableByKey(job.key);
        }
        await this.queue.add('sweep', {}, {
            repeat: { every: 15 * 60 * 1_000 },
            removeOnComplete: true,
            removeOnFail: { count: 20 },
        });
        this.logger.log('Approval escalation sweep scheduled (every 15 min)');
    }
};
exports.EscalationService = EscalationService;
exports.EscalationService = EscalationService = EscalationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(queue_constants_1.APPROVAL_ESCALATION_QUEUE)),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], EscalationService);
//# sourceMappingURL=escalation.service.js.map