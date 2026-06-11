"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPolicies1749900000000 = void 0;
class ClientPolicies1749900000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE policy_versions (
        id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id     UUID         NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        version_number INTEGER      NOT NULL,
        snapshot       JSONB        NOT NULL,
        changed_by     UUID,
        created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (partner_id, version_number)
      )
    `);
        await queryRunner.query(`ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY tenant_isolation ON policy_versions
        USING (partner_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
        await queryRunner.query(`GRANT SELECT, INSERT ON policy_versions TO reclaim_app`);
        await queryRunner.query(`CREATE INDEX idx_policy_versions_partner ON policy_versions (partner_id, version_number DESC)`);
        await queryRunner.query(`
      CREATE TABLE client_policies (
        id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        partner_id       UUID         NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        client_id        UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
        policy_overrides JSONB        NOT NULL DEFAULT '{}',
        notes            TEXT,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`ALTER TABLE client_policies ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY tenant_isolation ON client_policies
        USING (partner_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
        await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON client_policies TO reclaim_app`);
        await queryRunner.query(`CREATE INDEX idx_client_policies_client ON client_policies (client_id)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS client_policies`);
        await queryRunner.query(`DROP TABLE IF EXISTS policy_versions`);
    }
}
exports.ClientPolicies1749900000000 = ClientPolicies1749900000000;
//# sourceMappingURL=1749900000000-ClientPolicies.js.map