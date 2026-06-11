"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCoreDataEntities1749085200000 = void 0;
class AddCoreDataEntities1749085200000 {
    constructor() {
        this.name = 'AddCoreDataEntities1749085200000';
    }
    async up(queryRunner) {
        const clientsInTenant = `
      SELECT id FROM clients
      WHERE partner_id::text = nullif(current_setting('app.current_tenant_id', true), '')
    `;
        const employeesInTenant = `
      SELECT id FROM employees WHERE client_id IN (${clientsInTenant})
    `;
        await queryRunner.query(`
      ALTER TABLE expenses
        ADD COLUMN parent_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL
    `);
        await queryRunner.query(`
      CREATE INDEX idx_expenses_parent_id
        ON expenses(parent_expense_id)
        WHERE parent_expense_id IS NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE expenses
        ADD CONSTRAINT expenses_status_check
        CHECK (status IN ('pending','approved','needs_review','rejected','erp_exported'))
    `);
        await queryRunner.query(`
      ALTER TABLE employees ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
    `);
        await queryRunner.query(`
      CREATE TABLE welfare_balances (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        amount        DECIMAL(19,4) NOT NULL,
        balance_after DECIMAL(19,4) NOT NULL,
        reason        VARCHAR NOT NULL,
        expense_id    UUID REFERENCES expenses(id) ON DELETE SET NULL,
        period_month  VARCHAR(7) NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX idx_welfare_employee_period
        ON welfare_balances(employee_id, period_month)
    `);
        await queryRunner.query(`
      CREATE INDEX idx_welfare_expense_id
        ON welfare_balances(expense_id)
        WHERE expense_id IS NOT NULL
    `);
        await queryRunner.query(`ALTER TABLE welfare_balances ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE welfare_balances FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY welfare_balances_tenant_isolation ON welfare_balances
        FOR ALL USING (employee_id IN (${employeesInTenant}))
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT ON welfare_balances TO reclaim_app
    `);
        await queryRunner.query(`
      CREATE TABLE employee_bank_accounts (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id              UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        bank_name                VARCHAR NOT NULL,
        account_number_encrypted VARCHAR NOT NULL,
        last_four                VARCHAR(4) NOT NULL,
        account_holder_name      VARCHAR,
        is_primary               BOOLEAN NOT NULL DEFAULT FALSE,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX idx_bank_accounts_employee
        ON employee_bank_accounts(employee_id)
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX idx_bank_accounts_one_primary
        ON employee_bank_accounts(employee_id)
        WHERE is_primary = TRUE
    `);
        await queryRunner.query(`ALTER TABLE employee_bank_accounts ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE employee_bank_accounts FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY employee_bank_accounts_tenant_isolation ON employee_bank_accounts
        FOR ALL USING (employee_id IN (${employeesInTenant}))
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON employee_bank_accounts TO reclaim_app
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS employee_bank_accounts CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS welfare_balances CASCADE`);
        await queryRunner.query(`ALTER TABLE employees DROP COLUMN IF EXISTS is_active`);
        await queryRunner.query(`ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_parent_id`);
        await queryRunner.query(`ALTER TABLE expenses DROP COLUMN IF EXISTS parent_expense_id`);
    }
}
exports.AddCoreDataEntities1749085200000 = AddCoreDataEntities1749085200000;
//# sourceMappingURL=1749085200000-AddCoreDataEntities.js.map