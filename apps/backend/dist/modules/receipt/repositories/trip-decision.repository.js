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
exports.TripDecisionRepository = void 0;
const common_1 = require("@nestjs/common");
const base_repository_1 = require("../../../database/repositories/base.repository");
const trip_decision_entity_1 = require("../../../database/entities/trip-decision.entity");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_1 = require("typeorm");
let TripDecisionRepository = class TripDecisionRepository extends base_repository_1.BaseRepository {
    constructor(cls, dataSource) {
        super(cls, dataSource, trip_decision_entity_1.TripDecision);
    }
    async findActiveTrip(employeeId, receiptDate) {
        return this.repository
            .createQueryBuilder('td')
            .where('td.employee_id = :employeeId', { employeeId })
            .andWhere('td.status = :status', { status: 'approved' })
            .andWhere(':receiptDate BETWEEN td.start_date AND td.end_date', {
            receiptDate,
        })
            .getOne();
    }
};
exports.TripDecisionRepository = TripDecisionRepository;
exports.TripDecisionRepository = TripDecisionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService, typeorm_1.DataSource])
], TripDecisionRepository);
//# sourceMappingURL=trip-decision.repository.js.map