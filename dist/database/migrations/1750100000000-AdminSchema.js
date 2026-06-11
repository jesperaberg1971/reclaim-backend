"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSchema1750100000000 = void 0;
class AdminSchema1750100000000 {
    constructor() {
        this.name = 'AdminSchema1750100000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT users_role_check
    `);
        await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('partner_admin','client_admin','employee','super_admin'))
    `);
        await queryRunner.query(`
      ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    `);
        await queryRunner.query(`
      ALTER TABLE users    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token      TEXT        PRIMARY KEY,
        user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS prt_user_id ON password_reset_tokens (user_id)
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT, DELETE ON password_reset_tokens TO reclaim_app
    `);
        const adminBypass = `current_setting('app.is_super_admin', true) = 'true'`;
        for (const [table, policyName] of [
            ['partners', 'partners_admin_bypass'],
            ['clients', 'clients_admin_bypass'],
            ['users', 'users_admin_bypass'],
            ['employees', 'employees_admin_bypass'],
            ['subscriptions', 'subscriptions_admin_bypass'],
            ['expenses', 'expenses_admin_bypass'],
        ]) {
            await queryRunner.query(`
        CREATE POLICY ${policyName} ON ${table}
          AS PERMISSIVE
          FOR ALL
          USING (${adminBypass})
          WITH CHECK (${adminBypass})
      `);
        }
    }
    async down(queryRunner) {
        for (const [table, policyName] of [
            ['expenses', 'expenses_admin_bypass'],
            ['subscriptions', 'subscriptions_admin_bypass'],
            ['employees', 'employees_admin_bypass'],
            ['users', 'users_admin_bypass'],
            ['clients', 'clients_admin_bypass'],
            ['partners', 'partners_admin_bypass'],
        ]) {
            await queryRunner.query(`DROP POLICY IF EXISTS ${policyName} ON ${table}`);
        }
        await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS is_active`);
        await queryRunner.query(`ALTER TABLE partners DROP COLUMN IF EXISTS is_active`);
        await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT users_role_check`);
        await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('partner_admin','client_admin','employee'))
    `);
    }
}
exports.AdminSchema1750100000000 = AdminSchema1750100000000;
//# sourceMappingURL=1750100000000-AdminSchema.js.map