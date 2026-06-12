"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditLogs1749100000000 = void 0;
class AddAuditLogs1749100000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id     UUID         REFERENCES partners(id) ON DELETE SET NULL,
        user_id       UUID,
        action        TEXT         NOT NULL,
        resource_type TEXT,
        resource_id   TEXT,
        ip_address    TEXT,
        metadata      JSONB,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS audit_logs_action        ON audit_logs (action);
      CREATE INDEX IF NOT EXISTS audit_logs_user          ON audit_logs (user_id);

      -- Only the app role may insert; no UPDATE or DELETE (immutable ledger)
      GRANT SELECT, INSERT ON audit_logs TO reclaim_app;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
    }
}
exports.AddAuditLogs1749100000000 = AddAuditLogs1749100000000;
//# sourceMappingURL=1749100000000-AddAuditLogs.js.map