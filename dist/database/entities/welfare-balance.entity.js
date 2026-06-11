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
exports.WelfareBalance = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const decimal_column_transformer_1 = require("../transformers/decimal-column.transformer");
const decimal_js_1 = require("decimal.js");
let WelfareBalance = class WelfareBalance {
};
exports.WelfareBalance = WelfareBalance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WelfareBalance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'employee_id' }),
    __metadata("design:type", employee_entity_1.Employee)
], WelfareBalance.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WelfareBalance.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], WelfareBalance.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], WelfareBalance.prototype, "balance_after", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WelfareBalance.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], WelfareBalance.prototype, "expense_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7 }),
    __metadata("design:type", String)
], WelfareBalance.prototype, "period_month", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WelfareBalance.prototype, "created_at", void 0);
exports.WelfareBalance = WelfareBalance = __decorate([
    (0, typeorm_1.Entity)('welfare_balances')
], WelfareBalance);
//# sourceMappingURL=welfare-balance.entity.js.map