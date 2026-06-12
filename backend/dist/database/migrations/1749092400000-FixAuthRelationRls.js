"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixAuthRelationRls1749092400000 = void 0;
class FixAuthRelationRls1749092400000 {
    constructor() {
        this.name = 'FixAuthRelationRls1749092400000';
        this.tenantCheck = (col) => `nullif(current_setting('app.current_tenant_id', true), '') = ${col}::text`;
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP POLICY partners_tenant_isolation ON partners`);
        await queryRunner.query(`
      CREATE POLICY partners_select ON partners
        AS PERMISSIVE FOR SELECT
        USING (
          nullif(current_setting('app.current_tenant_id', true), '') IS NULL
          OR ${this.tenantCheck('id')}
        )
    `);
        await queryRunner.query(`
      CREATE POLICY partners_write ON partners
        AS PERMISSIVE FOR INSERT
        WITH CHECK (${this.tenantCheck('id')})
    `);
        await queryRunner.query(`
      CREATE POLICY partners_update ON partners
        AS PERMISSIVE FOR UPDATE
        USING (${this.tenantCheck('id')})
    `);
        await queryRunner.query(`
      CREATE POLICY partners_delete ON partners
        AS PERMISSIVE FOR DELETE
        USING (${this.tenantCheck('id')})
    `);
        await queryRunner.query(`DROP POLICY clients_tenant_isolation ON clients`);
        await queryRunner.query(`
      CREATE POLICY clients_select ON clients
        AS PERMISSIVE FOR SELECT
        USING (
          nullif(current_setting('app.current_tenant_id', true), '') IS NULL
          OR ${this.tenantCheck('partner_id')}
        )
    `);
        await queryRunner.query(`
      CREATE POLICY clients_write ON clients
        AS PERMISSIVE FOR INSERT
        WITH CHECK (${this.tenantCheck('partner_id')})
    `);
        await queryRunner.query(`
      CREATE POLICY clients_update ON clients
        AS PERMISSIVE FOR UPDATE
        USING (${this.tenantCheck('partner_id')})
    `);
        await queryRunner.query(`
      CREATE POLICY clients_delete ON clients
        AS PERMISSIVE FOR DELETE
        USING (${this.tenantCheck('partner_id')})
    `);
    }
    async down(queryRunner) {
        for (const t of ['partners', 'clients']) {
            await queryRunner.query(`DROP POLICY IF EXISTS ${t.slice(0, -1)}_select ON ${t}`);
            await queryRunner.query(`DROP POLICY IF EXISTS ${t.slice(0, -1)}_write ON ${t}`);
            await queryRunner.query(`DROP POLICY IF EXISTS ${t.slice(0, -1)}_update ON ${t}`);
            await queryRunner.query(`DROP POLICY IF EXISTS ${t.slice(0, -1)}_delete ON ${t}`);
        }
        await queryRunner.query(`
      CREATE POLICY partners_tenant_isolation ON partners FOR ALL
        USING (nullif(current_setting('app.current_tenant_id', true), '') = id::text)
    `);
        await queryRunner.query(`
      CREATE POLICY clients_tenant_isolation ON clients FOR ALL
        USING (nullif(current_setting('app.current_tenant_id', true), '') = partner_id::text)
    `);
    }
}
exports.FixAuthRelationRls1749092400000 = FixAuthRelationRls1749092400000;
//# sourceMappingURL=1749092400000-FixAuthRelationRls.js.map