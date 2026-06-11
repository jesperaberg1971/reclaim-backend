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
exports.ExpenseRepository = void 0;
const common_1 = require("@nestjs/common");
const base_repository_1 = require("../../../database/repositories/base.repository");
const expense_entity_1 = require("../../../database/entities/expense.entity");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_1 = require("typeorm");
const decimal_js_1 = require("decimal.js");
let ExpenseRepository = class ExpenseRepository extends base_repository_1.BaseRepository {
    constructor(cls, dataSource) {
        super(cls, dataSource, expense_entity_1.Expense);
    }
    async getMonthlyMealTotal(employeeId, receiptDate) {
        const startOfMonth = new Date(receiptDate.getFullYear(), receiptDate.getMonth(), 1);
        const endOfMonth = new Date(receiptDate.getFullYear(), receiptDate.getMonth() + 1, 0);
        const result = await this.repository
            .createQueryBuilder('e')
            .select('SUM(e.final_amount_deductible)', 'total')
            .where('e.employee_id = :employeeId', { employeeId })
            .andWhere('e.final_category = :category', { category: 'welfare_allowance' })
            .andWhere('e.receipt_date BETWEEN :start AND :end', { start: startOfMonth, end: endOfMonth })
            .getRawOne();
        return new decimal_js_1.Decimal(result?.total || 0);
    }
};
exports.ExpenseRepository = ExpenseRepository;
exports.ExpenseRepository = ExpenseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService,
        typeorm_1.DataSource])
], ExpenseRepository);
//# sourceMappingURL=expense.repository.js.map