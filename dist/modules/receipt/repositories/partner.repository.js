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
exports.PartnerRepository = void 0;
const common_1 = require("@nestjs/common");
const base_repository_1 = require("../../../database/repositories/base.repository");
const partner_entity_1 = require("../../../database/entities/partner.entity");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_1 = require("typeorm");
let PartnerRepository = class PartnerRepository extends base_repository_1.BaseRepository {
    constructor(cls, dataSource) {
        super(cls, dataSource, partner_entity_1.Partner);
    }
    async findByClientId(clientId) {
        return this.repository
            .createQueryBuilder('p')
            .innerJoin('clients', 'c', 'c.partner_id = p.id')
            .where('c.id = :clientId', { clientId })
            .select(['p.id', 'p.policies', 'p.tax_code'])
            .getOne();
    }
};
exports.PartnerRepository = PartnerRepository;
exports.PartnerRepository = PartnerRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService, typeorm_1.DataSource])
], PartnerRepository);
//# sourceMappingURL=partner.repository.js.map