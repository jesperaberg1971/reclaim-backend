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
exports.BrandingService = exports.UpdateBrandingDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const redis_service_1 = require("../../common/redis/redis.service");
const partner_entity_1 = require("../../database/entities/partner.entity");
const CACHE_TTL = 3_600;
const CACHE_KEY = (partnerId) => `brand:${partnerId}`;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
class UpdateBrandingDto {
}
exports.UpdateBrandingDto = UpdateBrandingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "logo_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(HEX_COLOR, { message: 'primary_color must be a 6-digit hex color e.g. #1a56db' }),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "primary_color", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(HEX_COLOR, { message: 'accent_color must be a 6-digit hex color' }),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "accent_color", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "company_display_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "report_header", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateBrandingDto.prototype, "report_footer", void 0);
let BrandingService = class BrandingService {
    constructor(dataSource, redisService) {
        this.dataSource = dataSource;
        this.redisService = redisService;
    }
    async getBranding(partnerId) {
        const cached = await this.redisService.cacheGet(CACHE_KEY(partnerId));
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch { }
        }
        const rows = await this.dataSource.query(`SELECT branding FROM partners WHERE id = $1`, [partnerId]);
        if (!rows.length)
            throw new common_1.NotFoundException(`Partner ${partnerId} not found`);
        const branding = rows[0].branding
            ? { ...partner_entity_1.DEFAULT_BRANDING, ...rows[0].branding }
            : { ...partner_entity_1.DEFAULT_BRANDING };
        await this.redisService.cacheSet(CACHE_KEY(partnerId), JSON.stringify(branding), CACHE_TTL);
        return branding;
    }
    async updateBranding(partnerId, dto) {
        const current = await this.getBranding(partnerId);
        const updated = {
            ...current,
            ...(dto.logo_url !== undefined ? { logo_url: dto.logo_url ?? null } : {}),
            ...(dto.primary_color ? { primary_color: dto.primary_color } : {}),
            ...(dto.accent_color ? { accent_color: dto.accent_color } : {}),
            ...(dto.company_display_name !== undefined ? { company_display_name: dto.company_display_name ?? null } : {}),
            ...(dto.report_header !== undefined ? { report_header: dto.report_header ?? null } : {}),
            ...(dto.report_footer !== undefined ? { report_footer: dto.report_footer ?? null } : {}),
        };
        const result = await this.dataSource.query(`UPDATE partners SET branding = $1::jsonb WHERE id = $2 RETURNING id`, [JSON.stringify(updated), partnerId]);
        if (!result.length)
            throw new common_1.NotFoundException(`Partner ${partnerId} not found`);
        await this.redisService.cacheDelete(CACHE_KEY(partnerId));
        return updated;
    }
    buildCssVars(branding) {
        return `:root{--brand:${branding.primary_color};--brand-lt:${this.lighten(branding.primary_color)};--brand-accent:${branding.accent_color};}`;
    }
    resolveDisplayName(branding, fallbackName) {
        return branding.company_display_name?.trim() || fallbackName;
    }
    lighten(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const tint = (c) => Math.round(c + (255 - c) * 0.85).toString(16).padStart(2, '0');
        return `#${tint(r)}${tint(g)}${tint(b)}`;
    }
};
exports.BrandingService = BrandingService;
exports.BrandingService = BrandingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        redis_service_1.RedisService])
], BrandingService);
//# sourceMappingURL=branding.service.js.map