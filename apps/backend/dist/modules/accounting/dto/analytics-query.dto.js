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
exports.ReportExportQueryDto = exports.PerformanceQueryDto = exports.SpendingQueryDto = void 0;
const class_validator_1 = require("class-validator");
class SpendingQueryDto {
}
exports.SpendingQueryDto = SpendingQueryDto;
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], SpendingQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], SpendingQueryDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SpendingQueryDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['category', 'employee', 'gate', 'period']),
    __metadata("design:type", String)
], SpendingQueryDto.prototype, "groupBy", void 0);
class PerformanceQueryDto {
}
exports.PerformanceQueryDto = PerformanceQueryDto;
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], PerformanceQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], PerformanceQueryDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PerformanceQueryDto.prototype, "clientId", void 0);
class ReportExportQueryDto {
}
exports.ReportExportQueryDto = ReportExportQueryDto;
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], ReportExportQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: false }),
    __metadata("design:type", String)
], ReportExportQueryDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReportExportQueryDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['spending', 'gate-performance', 'client-insights']),
    __metadata("design:type", String)
], ReportExportQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['category', 'employee', 'gate', 'period']),
    __metadata("design:type", String)
], ReportExportQueryDto.prototype, "groupBy", void 0);
//# sourceMappingURL=analytics-query.dto.js.map