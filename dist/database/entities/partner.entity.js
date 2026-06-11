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
exports.Partner = exports.DEFAULT_BRANDING = void 0;
const typeorm_1 = require("typeorm");
const client_entity_1 = require("./client.entity");
const subscription_entity_1 = require("./subscription.entity");
exports.DEFAULT_BRANDING = {
    logo_url: null,
    primary_color: '#1a56db',
    accent_color: '#1741b6',
    company_display_name: null,
    report_header: null,
    report_footer: null,
};
let Partner = class Partner {
};
exports.Partner = Partner;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Partner.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Partner.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Partner.prototype, "tax_code", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb'),
    __metadata("design:type", Object)
], Partner.prototype, "policies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Partner.prototype, "branding", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => client_entity_1.Client, client => client.partner),
    __metadata("design:type", Array)
], Partner.prototype, "clients", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => subscription_entity_1.Subscription, sub => sub.partner),
    __metadata("design:type", Array)
], Partner.prototype, "subscriptions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Partner.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Partner.prototype, "created_at", void 0);
exports.Partner = Partner = __decorate([
    (0, typeorm_1.Entity)('partners')
], Partner);
//# sourceMappingURL=partner.entity.js.map