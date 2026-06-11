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
var EscalationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const typeorm_1 = require("typeorm");
const queue_constants_1 = require("../queue/queue.constants");
const approval_chain_service_1 = require("./approval-chain.service");
const notifications_service_1 = require("../notifications/notifications.service");
let EscalationProcessor = EscalationProcessor_1 = class EscalationProcessor extends bullmq_1.WorkerHost {
    constructor(dataSource, chainService, notificationsService) {
        super();
        this.dataSource = dataSource;
        this.chainService = chainService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(EscalationProcessor_1.name);
    }
    async process(_job) {
        const partners = await this.dataSource.query(`SELECT id,
              COALESCE((policies->>'approval_escalation_hours')::int, 0) AS hours
       FROM partners
       WHERE COALESCE((policies->>'approval_escalation_hours')::int, 0) > 0`);
        if (!partners.length)
            return;
        this.logger.log(`Escalation sweep: checking ${partners.length} partner(s)`);
        for (const { id: tenantId, hours } of partners) {
            try {
                await this.processTenant(tenantId, hours);
            }
            catch (err) {
                this.logger.error(`Escalation sweep failed for tenant=${tenantId}: ${err?.message}`);
            }
        }
    }
    async processTenant(tenantId, hours) {
        const outcomes = [];
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const stale = await manager.query(`SELECT id, expense_id, step_type
           FROM expense_approval_steps
           WHERE partner_id   = $1
             AND status       = 'pending'
             AND is_escalated = false
             AND created_at   < NOW() - make_interval(hours => $2)
           ORDER BY expense_id, step_order`, [tenantId, hours]);
            if (!stale.length)
                return;
            this.logger.log(`Tenant ${tenantId}: escalating ${stale.length} stale step(s)`);
            for (const step of stale) {
                const outcome = await this.chainService.escalateStep(step, manager);
                outcomes.push(outcome);
            }
        });
        for (const outcome of outcomes) {
            if (outcome.type === 'all_done') {
                void this.notificationsService.notifyExpenseDecision(outcome.expenseId, tenantId, 'approved', 'Auto-escalated: approval timeout exceeded');
            }
            else {
                void this.notificationsService.notifyAccountantStepReady(tenantId, outcome.expenseId);
            }
        }
    }
};
exports.EscalationProcessor = EscalationProcessor;
exports.EscalationProcessor = EscalationProcessor = EscalationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_constants_1.APPROVAL_ESCALATION_QUEUE, { concurrency: 1 }),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        approval_chain_service_1.ApprovalChainService,
        notifications_service_1.NotificationsService])
], EscalationProcessor);
//# sourceMappingURL=escalation.processor.js.map