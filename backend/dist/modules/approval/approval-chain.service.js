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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalChainService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../../common/audit/audit.service");
const ROLE_TO_STEP = {
    client_admin: 'manager',
    partner_admin: 'accountant',
};
let ApprovalChainService = class ApprovalChainService {
    constructor(dataSource, notificationsService, auditService) {
        this.dataSource = dataSource;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async getChain(expenseId, tenantId) {
        const steps = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            return manager.query(`SELECT step_order, step_type, status, decided_by, decided_at, note
         FROM expense_approval_steps
         WHERE expense_id = $1
         ORDER BY step_order`, [expenseId]);
        });
        return this.toResponse(expenseId, steps);
    }
    async approveStep(expenseId, tenantId, userId, role, note) {
        const { updatedSteps, completedStepType, allDone } = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const steps = await manager.query(`SELECT id, step_order, step_type, status
           FROM expense_approval_steps
           WHERE expense_id = $1
           ORDER BY step_order
           FOR UPDATE`, [expenseId]);
            if (!steps.length)
                throw new common_1.NotFoundException('No approval chain found for this expense');
            const current = steps.find((s) => s.status === 'pending');
            if (!current)
                throw new common_1.BadRequestException('All steps are already completed');
            const required = ROLE_TO_STEP[role];
            if (!required || current.step_type !== required) {
                throw new common_1.ForbiddenException(`Step '${current.step_type}' requires role '${current.step_type === 'manager' ? 'client_admin' : 'partner_admin'}'`);
            }
            await manager.query(`UPDATE expense_approval_steps
           SET status = 'approved', decided_by = $1, decided_at = NOW(), note = $2
           WHERE id = $3`, [userId, note ?? null, current.id]);
            const remainingPending = steps.filter((s) => s.id !== current.id && s.status === 'pending');
            if (remainingPending.length === 0) {
                await manager.query(`UPDATE expenses
             SET approval_decision      = 'approved',
                 accountant_reviewed_at = NOW(),
                 accountant_reviewed_by = $1,
                 reviewer_note          = $2
             WHERE id = $3`, [userId, note ?? null, expenseId]);
            }
            const updatedSteps = await manager.query(`SELECT step_order, step_type, status, decided_by, decided_at, note
           FROM expense_approval_steps WHERE expense_id = $1 ORDER BY step_order`, [expenseId]);
            return {
                updatedSteps,
                completedStepType: current.step_type,
                allDone: remainingPending.length === 0,
            };
        });
        void this.auditService.log({
            tenantId,
            userId,
            action: 'expense_approve',
            resourceType: 'expense',
            resourceId: expenseId,
            metadata: { role, note: note ?? null },
        });
        if (allDone) {
            void this.notificationsService.notifyExpenseDecision(expenseId, tenantId, 'approved', note);
        }
        else if (completedStepType === 'manager') {
            void this.notificationsService.notifyAccountantStepReady(tenantId, expenseId);
        }
        return this.toResponse(expenseId, updatedSteps);
    }
    async rejectStep(expenseId, tenantId, userId, role, note) {
        const updatedSteps = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const steps = await manager.query(`SELECT id, step_order, step_type, status
         FROM expense_approval_steps
         WHERE expense_id = $1
         ORDER BY step_order
         FOR UPDATE`, [expenseId]);
            if (!steps.length)
                throw new common_1.NotFoundException('No approval chain found for this expense');
            const current = steps.find((s) => s.status === 'pending');
            if (!current)
                throw new common_1.BadRequestException('All steps are already completed');
            const required = ROLE_TO_STEP[role];
            if (!required || current.step_type !== required) {
                throw new common_1.ForbiddenException(`Step '${current.step_type}' requires role '${current.step_type === 'manager' ? 'client_admin' : 'partner_admin'}'`);
            }
            await manager.query(`UPDATE expense_approval_steps
         SET status = 'rejected', decided_by = $1, decided_at = NOW(), note = $2
         WHERE id = $3`, [userId, note ?? null, current.id]);
            await manager.query(`UPDATE expense_approval_steps SET status = 'skipped'
         WHERE expense_id = $1 AND status = 'pending'`, [expenseId]);
            await manager.query(`UPDATE expenses
         SET approval_decision      = 'rejected',
             accountant_reviewed_at = NOW(),
             accountant_reviewed_by = $1,
             reviewer_note          = $2,
             status                 = 'rejected'
         WHERE id = $3`, [userId, note ?? null, expenseId]);
            return manager.query(`SELECT step_order, step_type, status, decided_by, decided_at, note
         FROM expense_approval_steps WHERE expense_id = $1 ORDER BY step_order`, [expenseId]);
        });
        void this.auditService.log({
            tenantId,
            userId,
            action: 'expense_reject',
            resourceType: 'expense',
            resourceId: expenseId,
            metadata: { role, note: note ?? null },
        });
        void this.notificationsService.notifyExpenseDecision(expenseId, tenantId, 'rejected', note);
        return this.toResponse(expenseId, updatedSteps);
    }
    async getPendingQueue(tenantId, role, clientId) {
        const stepType = ROLE_TO_STEP[role];
        if (!stepType)
            return [];
        const rows = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const params = [tenantId, stepType];
            let clientFilter = '';
            if (stepType === 'accountant') {
                clientFilter = `
          AND NOT EXISTS (
            SELECT 1 FROM expense_approval_steps prior
            WHERE prior.expense_id = eas.expense_id
              AND prior.step_order < eas.step_order
              AND prior.status = 'pending'
          )`;
            }
            else if (clientId) {
                params.push(clientId);
                clientFilter = `AND e.client_id = $${params.length}`;
            }
            return manager.query(`SELECT e.id AS expense_id, e.receipt_date, e.original_amount, e.gate_applied,
                emp.full_name AS employee_name, c.name AS client_name,
                eas.created_at AS step_pending_since
         FROM expense_approval_steps eas
         JOIN expenses  e   ON e.id   = eas.expense_id
         JOIN employees emp ON emp.id = e.employee_id
         JOIN clients   c   ON c.id   = e.client_id
         WHERE eas.partner_id = $1
           AND eas.step_type  = $2
           AND eas.status     = 'pending'
           ${clientFilter}
         ORDER BY eas.created_at`, params);
        });
        return rows.map((r) => ({
            expense_id: r.expense_id,
            receipt_date: new Date(r.receipt_date).toISOString().slice(0, 10),
            employee_name: r.employee_name,
            client_name: r.client_name,
            original_amount: r.original_amount,
            gate_applied: r.gate_applied,
            pending_step_type: stepType,
            step_pending_since: new Date(r.step_pending_since).toISOString(),
        }));
    }
    async bulkApprove(expenseIds, tenantId, userId, role, note) {
        const result = { succeeded: [], failed: [] };
        for (const expenseId of expenseIds) {
            try {
                await this.approveStep(expenseId, tenantId, userId, role, note);
                result.succeeded.push(expenseId);
            }
            catch (err) {
                result.failed.push({ expenseId, error: err?.message ?? 'Unknown error' });
            }
        }
        return result;
    }
    async bulkReject(expenseIds, tenantId, userId, role, note) {
        const result = { succeeded: [], failed: [] };
        for (const expenseId of expenseIds) {
            try {
                await this.rejectStep(expenseId, tenantId, userId, role, note);
                result.succeeded.push(expenseId);
            }
            catch (err) {
                result.failed.push({ expenseId, error: err?.message ?? 'Unknown error' });
            }
        }
        return result;
    }
    async skipManagerStepsForTenant(tenantId) {
        const affectedExpenseIds = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const rows = await manager.query(`UPDATE expense_approval_steps
         SET status = 'skipped',
             note   = 'Policy changed: manager approval requirement removed'
         WHERE partner_id = $1
           AND step_type  = 'manager'
           AND status     = 'pending'
         RETURNING expense_id`, [tenantId]);
            return rows.map((r) => r.expense_id);
        });
        for (const expenseId of affectedExpenseIds) {
            void this.notificationsService.notifyAccountantStepReady(tenantId, expenseId);
        }
    }
    async escalateStep(step, txManager) {
        await txManager.query(`UPDATE expense_approval_steps
       SET status       = 'skipped',
           is_escalated = true,
           note         = 'Auto-escalated: approval timeout exceeded'
       WHERE id = $1`, [step.id]);
        const remaining = await txManager.query(`SELECT id FROM expense_approval_steps
       WHERE expense_id = $1 AND status = 'pending'`, [step.expense_id]);
        if (remaining.length === 0) {
            await txManager.query(`UPDATE expenses
         SET approval_decision      = 'approved',
             accountant_reviewed_at = NOW()
         WHERE id = $1`, [step.expense_id]);
            return { type: 'all_done', expenseId: step.expense_id };
        }
        return { type: 'manager_escalated', expenseId: step.expense_id };
    }
    toResponse(expenseId, rows) {
        if (!rows.length) {
            return {
                expense_id: expenseId,
                steps: [],
                current_step_type: null,
                overall_status: 'no_chain',
            };
        }
        const steps = rows.map((r) => ({
            step_order: r.step_order,
            step_type: r.step_type,
            status: r.status,
            decided_by: r.decided_by ?? null,
            decided_at: r.decided_at ? new Date(r.decided_at).toISOString() : null,
            note: r.note ?? null,
        }));
        const current = steps.find(s => s.status === 'pending') ?? null;
        const allApproved = steps.every(s => s.status === 'approved');
        const anyRejected = steps.some(s => s.status === 'rejected');
        return {
            expense_id: expenseId,
            steps,
            current_step_type: current?.step_type ?? null,
            overall_status: allApproved ? 'fully_approved' : anyRejected ? 'rejected' : 'pending',
        };
    }
};
exports.ApprovalChainService = ApprovalChainService;
exports.ApprovalChainService = ApprovalChainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], ApprovalChainService);
//# sourceMappingURL=approval-chain.service.js.map