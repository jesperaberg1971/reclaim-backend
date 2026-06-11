"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdpdConsentLog1750500000000 = void 0;
class PdpdConsentLog1750500000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pdpd_consent_log (
        id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id          UUID        REFERENCES employees(id) ON DELETE SET NULL,
        event                TEXT        NOT NULL
          CONSTRAINT pdpd_event_check
          CHECK (event IN ('consent_given','consent_withdrawn','data_exported','data_anonymized')),
        performed_by_user_id UUID,
        performed_by_role    TEXT,
        ip_address           TEXT,
        metadata             JSONB       NOT NULL DEFAULT '{}',
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS pdpd_log_employee_idx ON pdpd_consent_log (employee_id)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS pdpd_log_created_idx ON pdpd_consent_log (created_at DESC)`);
        await queryRunner.query(`GRANT SELECT, INSERT ON pdpd_consent_log TO reclaim_app`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS pdpd_consent_log`);
    }
}
exports.PdpdConsentLog1750500000000 = PdpdConsentLog1750500000000;
//# sourceMappingURL=1750500000000-PdpdConsentLog.js.map