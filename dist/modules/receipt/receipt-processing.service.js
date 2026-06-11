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
var ReceiptProcessingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptProcessingService = void 0;
exports.route = route;
exports.applyPolicyCategoryRules = applyPolicyCategoryRules;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
const expense_entity_1 = require("../../database/entities/expense.entity");
const employee_bank_account_entity_1 = require("../../database/entities/employee-bank-account.entity");
const expense_repository_1 = require("./repositories/expense.repository");
const trip_decision_repository_1 = require("./repositories/trip-decision.repository");
const partner_repository_1 = require("./repositories/partner.repository");
const pdf_service_1 = require("../pdf/pdf.service");
const notifications_service_1 = require("../notifications/notifications.service");
const branding_service_1 = require("../branding/branding.service");
const gate1_evaluator_1 = require("./gate-engine/gate1.evaluator");
const gate2_evaluator_1 = require("./gate-engine/gate2.evaluator");
const gate3_evaluator_1 = require("./gate-engine/gate3.evaluator");
const ZERO = new decimal_js_1.Decimal(0);
let ReceiptProcessingService = ReceiptProcessingService_1 = class ReceiptProcessingService {
    constructor(expenseRepo, tripRepo, partnerRepo, pdfService, dataSource, notificationsService, brandingService) {
        this.expenseRepo = expenseRepo;
        this.tripRepo = tripRepo;
        this.partnerRepo = partnerRepo;
        this.pdfService = pdfService;
        this.dataSource = dataSource;
        this.notificationsService = notificationsService;
        this.brandingService = brandingService;
        this.logger = new common_1.Logger(ReceiptProcessingService_1.name);
    }
    async processExpense(expenseId, tenantId) {
        this.logger.log(`3-Gate Engine: evaluating expense ${expenseId}`);
        let requireManagerApproval = false;
        const decision = await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const expense = await manager.findOne(expense_entity_1.Expense, { where: { id: expenseId } });
            if (!expense)
                throw new Error(`Expense ${expenseId} not found`);
            const partnerRow = await manager.query(`SELECT p.policies FROM partners p
         INNER JOIN clients c ON c.partner_id = p.id
         WHERE c.id = $1 LIMIT 1`, [expense.client_id]);
            if (!partnerRow?.length)
                throw new Error(`Partner not found for client ${expense.client_id}`);
            const partnerPolicies = partnerRow[0].policies;
            requireManagerApproval = partnerPolicies?.require_manager_approval ?? false;
            const clientPolicyRows = await manager.query(`SELECT policy_overrides FROM client_policies WHERE client_id = $1 LIMIT 1`, [expense.client_id]);
            const policies = {
                ...partnerPolicies,
                ...(clientPolicyRows?.[0]?.policy_overrides ?? {}),
            };
            const mealCap = new decimal_js_1.Decimal(String(policies.meal_cap_vnd));
            const welfareMonthly = new decimal_js_1.Decimal(String(policies.welfare_monthly_cap_vnd));
            const cardLimit = new decimal_js_1.Decimal(String(policies.personal_card_limit_vnd));
            const tripRow = await manager.query(`SELECT id, status, start_date, end_date, daily_allowance_amount,
                destination, purpose
         FROM trip_decisions
         WHERE employee_id = $1
           AND status = 'approved'
           AND $2::date BETWEEN start_date AND end_date
         LIMIT 1`, [expense.employee_id, expense.receipt_date]);
            const trip = tripRow?.length
                ? {
                    id: tripRow[0].id,
                    status: tripRow[0].status,
                    start_date: new Date(tripRow[0].start_date),
                    end_date: new Date(tripRow[0].end_date),
                    daily_allowance_amount: new decimal_js_1.Decimal(String(tripRow[0].daily_allowance_amount)),
                }
                : null;
            const periodMonth = toPeriodMonth(expense.receipt_date);
            const welfareUsed = await getWelfareUsedThisMonth(manager, expense.employee_id, periodMonth);
            const bankAccount = await manager.findOne(employee_bank_account_entity_1.EmployeeBankAccount, {
                where: { employee_id: expense.employee_id, is_primary: true },
            });
            const hasBankAccount = !!bankAccount;
            const paymentMethod = expense.ocr_raw_json?.paymentMethod ?? 'unknown';
            const amount = new decimal_js_1.Decimal(String(expense.original_amount));
            let decision = route(amount, expense.receipt_date, trip, paymentMethod, mealCap, welfareMonthly, welfareUsed, cardLimit, hasBankAccount);
            decision = applyPolicyCategoryRules(decision, policies.allowed_categories ?? [], policies.require_original_receipt ?? false, !!expense.receipt_image_url);
            await manager.update(expense_entity_1.Expense, expenseId, {
                gate_applied: decision.gate,
                final_category: decision.finalCategory,
                final_amount_deductible: decision.finalAmountDeductible,
                pit_flag: decision.pitFlag,
                status: decision.status,
            });
            this.logger.log(`Expense ${expenseId} → Gate ${decision.gate} | ${decision.finalCategory} | ` +
                `${decision.finalAmountDeductible} VND | ${decision.status}`);
            if (decision.status === expense_entity_1.ExpenseStatus.APPROVED) {
                const chainSteps = requireManagerApproval
                    ? [{ order: 1, type: 'manager' }, { order: 2, type: 'accountant' }]
                    : [{ order: 1, type: 'accountant' }];
                for (const step of chainSteps) {
                    await manager.query(`INSERT INTO expense_approval_steps (expense_id, partner_id, step_order, step_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (expense_id, step_order) DO NOTHING`, [expenseId, tenantId, step.order, step.type]);
                }
            }
            if (decision.gate === 1 && trip) {
                await this.attachTripDecisionPdf(manager, expense, tripRow[0], expenseId).catch((err) => this.logger.error(`PDF generation failed (non-fatal): ${err.message}`));
            }
            if (decision.gate === 2 && decision.finalAmountDeductible.gt(ZERO)) {
                await recordWelfareDebit(manager, expense.employee_id, decision.finalAmountDeductible.neg(), welfareUsed, expenseId, periodMonth);
            }
            if (decision.childAmount?.gt(ZERO)) {
                const g2 = (0, gate2_evaluator_1.evaluateGate2)(decision.childAmount, mealCap, welfareMonthly, welfareUsed);
                const child = manager.create(expense_entity_1.Expense, {
                    parent_expense_id: expenseId,
                    client_id: expense.client_id,
                    employee_id: expense.employee_id,
                    receipt_date: expense.receipt_date,
                    receipt_image_url: expense.receipt_image_url,
                    ocr_raw_json: expense.ocr_raw_json,
                    original_amount: decision.childAmount,
                    currency: expense.currency,
                    gate_applied: 2,
                    final_category: expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE,
                    final_amount_deductible: g2.deductible,
                    pit_flag: g2.pitFlag,
                    erp_exported: false,
                    status: expense_entity_1.ExpenseStatus.APPROVED,
                });
                const savedChild = await manager.save(expense_entity_1.Expense, child);
                this.logger.log(`Gate 1 overflow child created: ${savedChild.id} | ` +
                    `overflow ${decision.childAmount} VND → Gate 2 deductible ${g2.deductible} VND`);
                if (g2.deductible.gt(ZERO)) {
                    await recordWelfareDebit(manager, expense.employee_id, g2.deductible.neg(), welfareUsed, savedChild.id, periodMonth);
                }
            }
            return decision;
        });
        if (decision.status === expense_entity_1.ExpenseStatus.APPROVED) {
            if (requireManagerApproval) {
                void this.notificationsService.notifyManagerApprovalRequired(tenantId, expenseId);
            }
            else {
                void this.notificationsService.notifyReadyForReview(tenantId, expenseId);
            }
        }
        return decision;
    }
    async attachTripDecisionPdf(manager, expense, tripRow, expenseId) {
        const [empRow] = await manager.query(`SELECT full_name, employee_id FROM employees WHERE id = $1`, [expense.employee_id]);
        const [clientRow] = await manager.query(`SELECT name, partner_id FROM clients WHERE id = $1`, [expense.client_id]);
        const decisionNumber = String(Math.floor(Math.random() * 900) + 100);
        let logoUrl = null;
        let primaryColor = null;
        let reportFooter = null;
        if (clientRow?.partner_id) {
            try {
                const branding = await this.brandingService.getBranding(clientRow.partner_id);
                logoUrl = branding.logo_url;
                primaryColor = branding.primary_color !== '#1a56db' ? branding.primary_color : null;
                reportFooter = branding.report_footer;
            }
            catch {
            }
        }
        const ref = await this.pdfService.generateTripDecisionPdf({
            decisionNumber,
            companyName: clientRow?.name ?? 'Công ty',
            employeeFullName: empRow?.full_name ?? 'Nhân viên',
            employeeInternalId: empRow?.employee_id ?? expense.employee_id.slice(0, 8),
            destination: tripRow?.destination ?? 'Theo lịch công tác được phê duyệt',
            purpose: tripRow?.purpose ?? 'Công tác theo yêu cầu kinh doanh',
            startDate: new Date(tripRow.start_date),
            endDate: new Date(tripRow.end_date),
            dailyAllowanceVnd: new decimal_js_1.Decimal(String(tripRow.daily_allowance_amount)),
            logoUrl,
            primaryColor,
            reportFooter,
        });
        const currentDocs = await manager.query(`SELECT supporting_documents FROM expenses WHERE id = $1`, [expenseId]);
        const docs = currentDocs?.[0]?.supporting_documents ?? [];
        docs.push(ref);
        await manager.query(`UPDATE expenses SET supporting_documents = $1 WHERE id = $2`, [JSON.stringify(docs), expenseId]);
        this.logger.log(`Trip Decision PDF attached to expense ${expenseId}: ${ref.url}`);
    }
};
exports.ReceiptProcessingService = ReceiptProcessingService;
exports.ReceiptProcessingService = ReceiptProcessingService = ReceiptProcessingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [expense_repository_1.ExpenseRepository,
        trip_decision_repository_1.TripDecisionRepository,
        partner_repository_1.PartnerRepository,
        pdf_service_1.PdfService,
        typeorm_1.DataSource,
        notifications_service_1.NotificationsService,
        branding_service_1.BrandingService])
], ReceiptProcessingService);
function route(amount, receiptDate, trip, paymentMethod, mealCap, welfareMonthly, welfareUsed, cardLimit, hasBankAccount) {
    const g1 = (0, gate1_evaluator_1.evaluateGate1)(amount, receiptDate, trip);
    if (g1.applicable) {
        return {
            gate: 1,
            finalCategory: expense_entity_1.ExpenseCategory.TRAVEL_ALLOWANCE,
            finalAmountDeductible: g1.deductible,
            pitFlag: false,
            status: g1.deductible.gt(ZERO) ? expense_entity_1.ExpenseStatus.APPROVED : expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            reason: g1.reason,
            childAmount: g1.overflow.gt(ZERO) ? g1.overflow : undefined,
        };
    }
    if (paymentMethod === 'card') {
        const g3 = (0, gate3_evaluator_1.evaluateGate3)(amount, cardLimit, hasBankAccount);
        if (g3.applicable) {
            return {
                gate: 3,
                finalCategory: expense_entity_1.ExpenseCategory.PERSONAL_CARD_REIMBURSEMENT,
                finalAmountDeductible: g3.deductible,
                pitFlag: false,
                status: g3.needsReview ? expense_entity_1.ExpenseStatus.NEEDS_REVIEW : expense_entity_1.ExpenseStatus.APPROVED,
                reason: g3.reason,
            };
        }
    }
    const g2 = (0, gate2_evaluator_1.evaluateGate2)(amount, mealCap, welfareMonthly, welfareUsed);
    return {
        gate: 2,
        finalCategory: expense_entity_1.ExpenseCategory.WELFARE_ALLOWANCE,
        finalAmountDeductible: g2.deductible,
        pitFlag: g2.pitFlag,
        status: expense_entity_1.ExpenseStatus.APPROVED,
        reason: g2.reason,
    };
}
function applyPolicyCategoryRules(decision, allowedCategories, requireOriginalReceipt, hasReceiptImage) {
    let result = decision;
    if (allowedCategories.length > 0 && !allowedCategories.includes(result.finalCategory)) {
        result = {
            ...result,
            status: expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            reason: `${result.reason} [Category '${result.finalCategory}' not in partner allow-list]`,
        };
    }
    if (requireOriginalReceipt && !hasReceiptImage) {
        result = {
            ...result,
            status: expense_entity_1.ExpenseStatus.NEEDS_REVIEW,
            reason: `${result.reason} [Original receipt required but no image on file]`,
        };
    }
    return result;
}
async function getWelfareUsedThisMonth(manager, employeeId, periodMonth) {
    const rows = await manager.query(`SELECT COALESCE(SUM(ABS(amount)), 0) AS used
     FROM welfare_balances
     WHERE employee_id = $1 AND period_month = $2 AND amount < 0`, [employeeId, periodMonth]);
    return new decimal_js_1.Decimal(String(rows?.[0]?.used ?? 0));
}
async function recordWelfareDebit(manager, employeeId, debitAmount, previousUsed, expenseId, periodMonth) {
    const balanceAfter = previousUsed.plus(debitAmount.abs()).neg();
    await manager.query(`INSERT INTO welfare_balances
       (employee_id, amount, balance_after, reason, expense_id, period_month)
     VALUES ($1, $2, $3, $4, $5, $6)`, [employeeId, debitAmount.toFixed(4), balanceAfter.toFixed(4),
        'gate2_debit', expenseId, periodMonth]);
}
function toPeriodMonth(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
//# sourceMappingURL=receipt-processing.service.js.map