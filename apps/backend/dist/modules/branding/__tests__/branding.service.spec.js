"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const branding_service_1 = require("../branding.service");
const partner_entity_1 = require("../../../database/entities/partner.entity");
function makeService(queryImpl, cacheGetImpl) {
    const ds = { query: queryImpl };
    const redis = {
        cacheGet: cacheGetImpl ?? jest.fn().mockResolvedValue(null),
        cacheSet: jest.fn().mockResolvedValue(undefined),
        cacheDelete: jest.fn().mockResolvedValue(undefined),
    };
    return { svc: new branding_service_1.BrandingService(ds, redis), redis, ds };
}
const PARTNER_ID = 'p-uuid-1234';
const BRANDING = { ...partner_entity_1.DEFAULT_BRANDING, primary_color: '#ff5500', company_display_name: 'ACME' };
describe('BrandingService.getBranding', () => {
    it('returns cached branding when Redis has it', async () => {
        const { svc, ds } = makeService(jest.fn(), jest.fn().mockResolvedValue(JSON.stringify(BRANDING)));
        const result = await svc.getBranding(PARTNER_ID);
        expect(result.primary_color).toBe('#ff5500');
        expect(ds.query).not.toHaveBeenCalled();
    });
    it('fetches from DB on cache miss and stores in cache', async () => {
        const q = jest.fn().mockResolvedValueOnce([{ branding: BRANDING }]);
        const { svc, redis } = makeService(q);
        const result = await svc.getBranding(PARTNER_ID);
        expect(result.primary_color).toBe('#ff5500');
        expect(redis.cacheSet).toHaveBeenCalledWith(`brand:${PARTNER_ID}`, expect.any(String), 3600);
    });
    it('throws NotFoundException when partner not found', async () => {
        const q = jest.fn().mockResolvedValueOnce([]);
        const { svc } = makeService(q);
        await expect(svc.getBranding(PARTNER_ID)).rejects.toBeInstanceOf(common_1.NotFoundException);
    });
    it('merges DB branding with DEFAULT_BRANDING', async () => {
        const partial = { primary_color: '#abc123' };
        const q = jest.fn().mockResolvedValueOnce([{ branding: partial }]);
        const { svc } = makeService(q);
        const result = await svc.getBranding(PARTNER_ID);
        expect(result.primary_color).toBe('#abc123');
        expect(result.accent_color).toBe(partner_entity_1.DEFAULT_BRANDING.accent_color);
    });
    it('returns DEFAULT_BRANDING when branding column is null', async () => {
        const q = jest.fn().mockResolvedValueOnce([{ branding: null }]);
        const { svc } = makeService(q);
        const result = await svc.getBranding(PARTNER_ID);
        expect(result).toEqual(partner_entity_1.DEFAULT_BRANDING);
    });
});
describe('BrandingService.updateBranding', () => {
    it('merges partial update over existing branding', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([{ branding: BRANDING }])
            .mockResolvedValueOnce([{ id: PARTNER_ID }]);
        const cacheGet = jest.fn().mockResolvedValue(null);
        const { svc, redis } = makeService(q, cacheGet);
        const dto = { primary_color: '#009900' };
        const result = await svc.updateBranding(PARTNER_ID, dto);
        expect(result.primary_color).toBe('#009900');
        expect(result.company_display_name).toBe('ACME');
        const [updateSql, updateParams] = q.mock.calls[1];
        expect(updateSql).toContain('UPDATE partners SET branding');
        expect(updateParams[0]).toContain('#009900');
        expect(redis.cacheDelete).toHaveBeenCalledWith(`brand:${PARTNER_ID}`);
    });
    it('sets logo_url to null when explicitly passed null', async () => {
        const existing = { ...BRANDING, logo_url: 'https://old.logo.com/img.png' };
        const q = jest.fn()
            .mockResolvedValueOnce([{ branding: existing }])
            .mockResolvedValueOnce([{ id: PARTNER_ID }]);
        const { svc } = makeService(q, jest.fn().mockResolvedValue(null));
        const result = await svc.updateBranding(PARTNER_ID, { logo_url: null });
        expect(result.logo_url).toBeNull();
    });
    it('throws NotFoundException when partner not found during update', async () => {
        const q = jest.fn()
            .mockResolvedValueOnce([{ branding: BRANDING }])
            .mockResolvedValueOnce([]);
        const { svc } = makeService(q, jest.fn().mockResolvedValue(null));
        await expect(svc.updateBranding(PARTNER_ID, { primary_color: '#123456' }))
            .rejects.toBeInstanceOf(common_1.NotFoundException);
    });
});
describe('BrandingService.buildCssVars', () => {
    it('builds a valid CSS :root block', () => {
        const { svc } = makeService(jest.fn());
        const css = svc.buildCssVars({ ...partner_entity_1.DEFAULT_BRANDING, primary_color: '#ff5500', accent_color: '#cc4400' });
        expect(css).toContain(':root{');
        expect(css).toContain('--brand:#ff5500');
        expect(css).toContain('--brand-accent:#cc4400');
    });
    it('computes a lighter tint for --brand-lt', () => {
        const { svc } = makeService(jest.fn());
        const css = svc.buildCssVars(partner_entity_1.DEFAULT_BRANDING);
        expect(css).toContain('--brand-lt:#');
        const ltMatch = css.match(/--brand-lt:(#[0-9a-f]{6})/);
        expect(ltMatch).toBeTruthy();
        expect(ltMatch[1]).not.toBe(partner_entity_1.DEFAULT_BRANDING.primary_color);
    });
});
describe('BrandingService.resolveDisplayName', () => {
    it('returns custom name when set', () => {
        const { svc } = makeService(jest.fn());
        expect(svc.resolveDisplayName({ ...partner_entity_1.DEFAULT_BRANDING, company_display_name: 'ACME' }, 'Fallback'))
            .toBe('ACME');
    });
    it('falls back to partner name when display name is null', () => {
        const { svc } = makeService(jest.fn());
        expect(svc.resolveDisplayName({ ...partner_entity_1.DEFAULT_BRANDING, company_display_name: null }, 'Partner Name'))
            .toBe('Partner Name');
    });
});
//# sourceMappingURL=branding.service.spec.js.map