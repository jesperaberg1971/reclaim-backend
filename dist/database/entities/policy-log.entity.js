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
exports.PolicyLog = void 0;
const typeorm_1 = require("typeorm");
const expense_entity_1 = require("./expense.entity");
let PolicyLog = class PolicyLog {
};
exports.PolicyLog = PolicyLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PolicyLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => expense_entity_1.Expense, { onDelete: 'CASCADE' }),
    __metadata("design:type", expense_entity_1.Expense)
], PolicyLog.prototype, "expense", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PolicyLog.prototype, "expense_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PolicyLog.prototype, "gate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PolicyLog.prototype, "decision_reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PolicyLog.prototype, "created_at", void 0);
exports.PolicyLog = PolicyLog = __decorate([
    (0, typeorm_1.Entity)('policy_logs')
], PolicyLog);
//# sourceMappingURL=policy-log.entity.js.map