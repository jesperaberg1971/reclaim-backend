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
exports.BulkActionDto = exports.BulkActionType = void 0;
const class_validator_1 = require("class-validator");
var BulkActionType;
(function (BulkActionType) {
    BulkActionType["APPROVE"] = "approve";
    BulkActionType["REJECT"] = "reject";
})(BulkActionType || (exports.BulkActionType = BulkActionType = {}));
class BulkActionDto {
}
exports.BulkActionDto = BulkActionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('all', { each: true }),
    __metadata("design:type", Array)
], BulkActionDto.prototype, "expenseIds", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(BulkActionType),
    __metadata("design:type", String)
], BulkActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkActionDto.prototype, "reviewer_notes", void 0);
//# sourceMappingURL=bulk-action.dto.js.map