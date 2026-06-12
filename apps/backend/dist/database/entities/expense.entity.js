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
exports.Expense = exports.ExpenseCategory = exports.ExpenseStatus = void 0;
const typeorm_1 = require("typeorm");
const client_entity_1 = require("./client.entity");
const employee_entity_1 = require("./employee.entity");
const decimal_column_transformer_1 = require("../transformers/decimal-column.transformer");
const decimal_js_1 = require("decimal.js");
var ExpenseStatus;
(function (ExpenseStatus) {
    ExpenseStatus["PENDING_OCR"] = "pending_ocr";
    ExpenseStatus["PROCESSING"] = "processing";
    ExpenseStatus["COMPLETE"] = "complete";
    ExpenseStatus["NEEDS_REVIEW"] = "needs_review";
    ExpenseStatus["FAILED"] = "failed";
    ExpenseStatus["APPROVED"] = "approved";
    ExpenseStatus["REJECTED"] = "rejected";
    ExpenseStatus["ERP_EXPORTED"] = "erp_exported";
})(ExpenseStatus || (exports.ExpenseStatus = ExpenseStatus = {}));
var ExpenseCategory;
(function (ExpenseCategory) {
    ExpenseCategory["TRAVEL_ALLOWANCE"] = "travel_allowance";
    ExpenseCategory["WELFARE_ALLOWANCE"] = "welfare_allowance";
    ExpenseCategory["PERSONAL_CARD_REIMBURSEMENT"] = "personal_card_reimbursement";
    ExpenseCategory["FLAGGED"] = "flagged";
})(ExpenseCategory || (exports.ExpenseCategory = ExpenseCategory = {}));
let Expense = class Expense {
};
exports.Expense = Expense;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Expense.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Expense, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_expense_id' }),
    __metadata("design:type", Expense)
], Expense.prototype, "parent_expense", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "parent_expense_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], Expense.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Expense.prototype, "client_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], Expense.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Expense.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '' }),
    __metadata("design:type", String)
], Expense.prototype, "receipt_image_url", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Expense.prototype, "ocr_raw_json", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], Expense.prototype, "original_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'VND' }),
    __metadata("design:type", String)
], Expense.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Expense.prototype, "receipt_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Expense.prototype, "gate_applied", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Expense.prototype, "final_category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], Expense.prototype, "final_amount_deductible", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Expense.prototype, "pit_flag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'erp_exported', default: false }),
    __metadata("design:type", Boolean)
], Expense.prototype, "erp_exported", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Expense.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Expense.prototype, "supporting_documents", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Expense.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Expense.prototype, "accountant_reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "accountant_reviewed_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "reviewer_note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8, nullable: true }),
    __metadata("design:type", String)
], Expense.prototype, "approval_decision", void 0);
exports.Expense = Expense = __decorate([
    (0, typeorm_1.Entity)('expenses')
], Expense);
//# sourceMappingURL=expense.entity.js.map