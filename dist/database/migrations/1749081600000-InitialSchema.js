"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1749081600000 = void 0;
class InitialSchema1749081600000 {
    constructor() {
        this.name = 'InitialSchema1749081600000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE billing_tiers (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tier            VARCHAR NOT NULL CHECK (tier IN ('micro','small','medium','large','enterprise')),
        min_clients     INT NOT NULL,
        max_clients     INT NOT NULL,
        monthly_price_vnd DECIMAL(19,4) NOT NULL
      )
    `);
        await queryRunner.query(`
      CREATE TABLE partners (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR NOT NULL UNIQUE,
        tax_code   VARCHAR NOT NULL UNIQUE,
        policies   JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE clients (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name           VARCHAR NOT NULL,
        partner_id     UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        employee_count INT NOT NULL DEFAULT 0
      )
    `);
        await queryRunner.query(`
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        role          VARCHAR NOT NULL CHECK (role IN ('partner_admin','client_admin','employee')),
        partner_id    UUID REFERENCES partners(id) ON DELETE SET NULL,
        client_id     UUID REFERENCES clients(id)  ON DELETE SET NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE employees (
        id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id               UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        employee_id             VARCHAR NOT NULL,
        full_name               VARCHAR,
        personal_bank_card_last4 VARCHAR,
        pdpd_consent            BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);
        await queryRunner.query(`
      CREATE TABLE subscriptions (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id        UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        tier              VARCHAR NOT NULL CHECK (tier IN ('micro','small','medium','large','enterprise')),
        monthly_price_vnd DECIMAL(19,4) NOT NULL,
        is_beta_pilot     BOOLEAN NOT NULL DEFAULT FALSE,
        next_billing_date TIMESTAMPTZ NOT NULL,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE expenses (
        id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id              UUID NOT NULL REFERENCES clients(id),
        employee_id            UUID NOT NULL REFERENCES employees(id),
        receipt_image_url      VARCHAR NOT NULL DEFAULT '',
        ocr_raw_json           JSONB NOT NULL DEFAULT '{}',
        original_amount        DECIMAL(19,4) NOT NULL,
        currency               VARCHAR NOT NULL DEFAULT 'VND',
        receipt_date           TIMESTAMPTZ NOT NULL,
        gate_applied           INT NOT NULL,
        final_category         VARCHAR NOT NULL,
        final_amount_deductible DECIMAL(19,4) NOT NULL,
        pit_flag               BOOLEAN NOT NULL DEFAULT FALSE,
        erp_exported           BOOLEAN NOT NULL DEFAULT FALSE,
        status                 VARCHAR NOT NULL,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE trip_decisions (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id           UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        start_date            DATE NOT NULL,
        end_date              DATE NOT NULL,
        daily_allowance_amount DECIMAL(19,4) NOT NULL,
        status                VARCHAR NOT NULL CHECK (status IN ('pending','approved','cancelled'))
      )
    `);
        await queryRunner.query(`
      CREATE TABLE policy_logs (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id      UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        gate            INT NOT NULL,
        decision_reason VARCHAR NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE attendance_checkins (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        check_in_date  DATE NOT NULL,
        latitude       DECIMAL(10,6) NOT NULL,
        longitude      DECIMAL(10,6) NOT NULL,
        photo_url      VARCHAR NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(employee_id, check_in_date)
      )
    `);
        await queryRunner.query(`CREATE INDEX idx_clients_partner_id      ON clients(partner_id)`);
        await queryRunner.query(`CREATE INDEX idx_employees_client_id      ON employees(client_id)`);
        await queryRunner.query(`CREATE INDEX idx_expenses_client_id       ON expenses(client_id)`);
        await queryRunner.query(`CREATE INDEX idx_expenses_employee_id     ON expenses(employee_id)`);
        await queryRunner.query(`CREATE INDEX idx_expenses_status          ON expenses(status)`);
        await queryRunner.query(`CREATE INDEX idx_expenses_erp_exported    ON expenses(erp_exported)`);
        await queryRunner.query(`CREATE INDEX idx_trip_decisions_employee  ON trip_decisions(employee_id)`);
        await queryRunner.query(`CREATE INDEX idx_policy_logs_expense_id   ON policy_logs(expense_id)`);
        await queryRunner.query(`CREATE INDEX idx_attendance_employee_date ON attendance_checkins(employee_id, check_in_date)`);
        await queryRunner.query(`CREATE INDEX idx_users_partner_id         ON users(partner_id)`);
        await queryRunner.query(`CREATE INDEX idx_users_client_id          ON users(client_id)`);
        await queryRunner.query(`CREATE INDEX idx_subscriptions_partner_id ON subscriptions(partner_id)`);
        const tenantCheck = (col) => `nullif(current_setting('app.current_tenant_id', true), '') = ${col}::text`;
        const clientsInTenant = `
      SELECT id FROM clients
      WHERE partner_id::text = nullif(current_setting('app.current_tenant_id', true), '')
    `;
        const employeesInTenant = `
      SELECT id FROM employees
      WHERE client_id IN (${clientsInTenant})
    `;
        await queryRunner.query(`ALTER TABLE partners ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE partners FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY partners_tenant_isolation ON partners
        FOR ALL USING (${tenantCheck('id')})
    `);
        await queryRunner.query(`ALTER TABLE clients ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE clients FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY clients_tenant_isolation ON clients
        FOR ALL USING (${tenantCheck('partner_id')})
    `);
        await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE users FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY users_tenant_isolation ON users
        FOR ALL USING (
          ${tenantCheck('partner_id')}
          OR client_id IN (${clientsInTenant})
        )
    `);
        await queryRunner.query(`ALTER TABLE employees ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE employees FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY employees_tenant_isolation ON employees
        FOR ALL USING (client_id IN (${clientsInTenant}))
    `);
        await queryRunner.query(`ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY subscriptions_tenant_isolation ON subscriptions
        FOR ALL USING (${tenantCheck('partner_id')})
    `);
        await queryRunner.query(`ALTER TABLE expenses ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE expenses FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY expenses_tenant_isolation ON expenses
        FOR ALL USING (client_id IN (${clientsInTenant}))
    `);
        await queryRunner.query(`ALTER TABLE trip_decisions ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE trip_decisions FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY trip_decisions_tenant_isolation ON trip_decisions
        FOR ALL USING (employee_id IN (${employeesInTenant}))
    `);
        await queryRunner.query(`ALTER TABLE policy_logs ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE policy_logs FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY policy_logs_tenant_isolation ON policy_logs
        FOR ALL USING (
          expense_id IN (
            SELECT id FROM expenses WHERE client_id IN (${clientsInTenant})
          )
        )
    `);
        await queryRunner.query(`ALTER TABLE attendance_checkins ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`ALTER TABLE attendance_checkins FORCE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY attendance_tenant_isolation ON attendance_checkins
        FOR ALL USING (employee_id IN (${employeesInTenant}))
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS attendance_checkins CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS policy_logs CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS trip_decisions CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS expenses CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS subscriptions CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS employees CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS clients CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS partners CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS billing_tiers CASCADE`);
    }
}
exports.InitialSchema1749081600000 = InitialSchema1749081600000;
//# sourceMappingURL=1749081600000-InitialSchema.js.map