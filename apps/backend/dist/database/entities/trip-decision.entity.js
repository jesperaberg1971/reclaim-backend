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
exports.TripDecision = void 0;
const typeorm_1 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const decimal_column_transformer_1 = require("../transformers/decimal-column.transformer");
const decimal_js_1 = require("decimal.js");
let TripDecision = class TripDecision {
};
exports.TripDecision = TripDecision;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TripDecision.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => employee_entity_1.Employee, { onDelete: 'CASCADE' }),
    __metadata("design:type", employee_entity_1.Employee)
], TripDecision.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], TripDecision.prototype, "employee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], TripDecision.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], TripDecision.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 19,
        scale: 4,
        transformer: new decimal_column_transformer_1.DecimalColumnTransformer(),
    }),
    __metadata("design:type", decimal_js_1.Decimal)
], TripDecision.prototype, "daily_allowance_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['pending', 'approved', 'cancelled'] }),
    __metadata("design:type", String)
], TripDecision.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripDecision.prototype, "destination", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TripDecision.prototype, "purpose", void 0);
exports.TripDecision = TripDecision = __decorate([
    (0, typeorm_1.Entity)('trip_decisions')
], TripDecision);
//# sourceMappingURL=trip-decision.entity.js.map