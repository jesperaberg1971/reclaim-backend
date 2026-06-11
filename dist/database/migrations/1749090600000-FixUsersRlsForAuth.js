"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixUsersRlsForAuth1749090600000 = void 0;
class FixUsersRlsForAuth1749090600000 {
    constructor() {
        this.name = 'FixUsersRlsForAuth1749090600000';
    }
    async up(queryRunner) {
        const clientsInTenant = `
      SELECT id FROM clients
      WHERE partner_id::text = nullif(current_setting('app.current_tenant_id', true), '')
    `;
        const tenantCheck = (col) => `nullif(current_setting('app.current_tenant_id', true), '') = ${col}::text`;
        await queryRunner.query(`DROP POLICY users_tenant_isolation ON users`);
        await queryRunner.query(`
      CREATE POLICY users_select ON users
        AS PERMISSIVE
        FOR SELECT
        USING (
          nullif(current_setting('app.current_tenant_id', true), '') IS NULL
          OR ${tenantCheck('partner_id')}
          OR client_id IN (${clientsInTenant})
        )
    `);
        await queryRunner.query(`
      CREATE POLICY users_insert ON users
        AS PERMISSIVE FOR INSERT WITH CHECK (true)
    `);
        await queryRunner.query(`
      CREATE POLICY users_update ON users
        AS PERMISSIVE
        FOR UPDATE
        USING (
          ${tenantCheck('partner_id')}
          OR client_id IN (${clientsInTenant})
        )
    `);
        await queryRunner.query(`
      CREATE POLICY users_delete ON users
        AS PERMISSIVE
        FOR DELETE
        USING (
          ${tenantCheck('partner_id')}
          OR client_id IN (${clientsInTenant})
        )
    `);
    }
    async down(queryRunner) {
        const clientsInTenant = `
      SELECT id FROM clients
      WHERE partner_id::text = nullif(current_setting('app.current_tenant_id', true), '')
    `;
        const tenantCheck = (col) => `nullif(current_setting('app.current_tenant_id', true), '') = ${col}::text`;
        await queryRunner.query(`DROP POLICY IF EXISTS users_select ON users`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_write ON users`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_update ON users`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_delete ON users`);
        await queryRunner.query(`
      CREATE POLICY users_tenant_isolation ON users
        FOR ALL USING (
          ${tenantCheck('partner_id')}
          OR client_id IN (${clientsInTenant})
        )
    `);
    }
}
exports.FixUsersRlsForAuth1749090600000 = FixUsersRlsForAuth1749090600000;
//# sourceMappingURL=1749090600000-FixUsersRlsForAuth.js.map