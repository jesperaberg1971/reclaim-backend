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
exports.BaseRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const nestjs_cls_1 = require("nestjs-cls");
let BaseRepository = class BaseRepository {
    constructor(cls, dataSource, entity) {
        this.cls = cls;
        this.dataSource = dataSource;
        this.entity = entity;
    }
    get repository() {
        return this.manager.getRepository(this.entity);
    }
    get manager() {
        const txManager = this.cls.get('transactionalEntityManager');
        return txManager || this.dataSource.manager;
    }
};
exports.BaseRepository = BaseRepository;
exports.BaseRepository = BaseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService,
        typeorm_1.DataSource, Object])
], BaseRepository);
//# sourceMappingURL=base.repository.js.map