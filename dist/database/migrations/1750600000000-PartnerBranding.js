"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerBranding1750600000000 = void 0;
class PartnerBranding1750600000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE partners
        ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{
          "logo_url": null,
          "primary_color": "#1a56db",
          "accent_color": "#1741b6",
          "company_display_name": null,
          "report_header": null,
          "report_footer": null
        }'::jsonb
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE partners DROP COLUMN IF EXISTS branding`);
    }
}
exports.PartnerBranding1750600000000 = PartnerBranding1750600000000;
//# sourceMappingURL=1750600000000-PartnerBranding.js.map