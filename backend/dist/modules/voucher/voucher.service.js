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
var VoucherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherService = void 0;
const common_1 = require("@nestjs/common");
const expense_repository_1 = require("../receipt/repositories/expense.repository");
let VoucherService = VoucherService_1 = class VoucherService {
    constructor(expenseRepo) {
        this.expenseRepo = expenseRepo;
        this.logger = new common_1.Logger(VoucherService_1.name);
    }
    async generateVoucherData(expenseId, tenantId) {
        const [ownership] = await this.expenseRepo.repository.manager.query(`SELECT e.id
       FROM expenses e
       JOIN clients c ON c.id = e.client_id
       WHERE e.id = $1 AND c.partner_id = $2 AND e.gate_applied = 3
       LIMIT 1`, [expenseId, tenantId]);
        if (!ownership) {
            throw new common_1.NotFoundException('Only Gate 3 personal card expenses can generate vouchers');
        }
        const expense = await this.expenseRepo.repository.findOne({
            where: { id: expenseId, gate_applied: 3 },
            relations: ['employee'],
        });
        if (!expense || expense.final_category !== 'personal_card_reimbursement') {
            throw new common_1.NotFoundException('Only Gate 3 personal card expenses can generate vouchers');
        }
        return {
            voucherNumber: `PV-${expense.id.slice(0, 8).toUpperCase()}`,
            date: expense.receipt_date,
            employeeName: expense.employee?.full_name || 'Unknown Employee',
            employeeId: expense.employee_id,
            amountVnd: expense.final_amount_deductible,
            reason: 'Personal card reimbursement - Gate 3',
            gateApplied: 3,
            receiptImageUrl: expense.receipt_image_url,
        };
    }
    async generatePdfBuffer(voucherData) {
        this.logger.log(`Generating PDF voucher ${voucherData.voucherNumber}`);
        const placeholderText = `
      RECLAIM - PAYMENT VOUCHER
      Number: ${voucherData.voucherNumber}
      Date: ${voucherData.date.toISOString().split('T')[0]}
      Employee: ${voucherData.employeeName}
      Amount: ${voucherData.amountVnd.toFixed(0)} VND
      Reason: ${voucherData.reason}
      Status: APPROVED (Gate 3)
    `;
        return Buffer.from(placeholderText, 'utf-8');
    }
};
exports.VoucherService = VoucherService;
exports.VoucherService = VoucherService = VoucherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [expense_repository_1.ExpenseRepository])
], VoucherService);
//# sourceMappingURL=voucher.service.js.map