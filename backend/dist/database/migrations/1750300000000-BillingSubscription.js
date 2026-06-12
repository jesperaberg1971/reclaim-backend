"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingSubscription1750300000000 = void 0;
class BillingSubscription1750300000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE subscriptions
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'trial'
          CONSTRAINT subscriptions_status_check CHECK (status IN ('trial','active','grace','overdue','cancelled')),
        ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'monthly'
          CONSTRAINT subscriptions_plan_type_check CHECK (plan_type IN ('monthly','annual')),
        ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ
    `);
        await queryRunner.query(`
      UPDATE subscriptions SET
        status         = CASE WHEN is_beta_pilot = true THEN 'trial' ELSE 'active' END,
        trial_ends_at  = created_at + INTERVAL '90 days'
      WHERE trial_ends_at IS NULL
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id       UUID        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        subscription_id  UUID        REFERENCES subscriptions(id) ON DELETE SET NULL,
        invoice_number   VARCHAR(50) NOT NULL,
        period_start     TIMESTAMPTZ NOT NULL,
        period_end       TIMESTAMPTZ NOT NULL,
        amount_vnd       DECIMAL(19,4) NOT NULL,
        status           TEXT        NOT NULL DEFAULT 'pending'
          CONSTRAINT invoices_status_check CHECK (status IN ('pending','paid','void')),
        due_date         TIMESTAMPTZ NOT NULL,
        paid_at          TIMESTAMPTZ,
        pdf_path         TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (partner_id, invoice_number)
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        provider           TEXT        NOT NULL DEFAULT 'manual',
        provider_reference TEXT,
        partner_id         UUID        REFERENCES partners(id) ON DELETE SET NULL,
        invoice_id         UUID        REFERENCES invoices(id) ON DELETE SET NULL,
        amount_vnd         DECIMAL(19,4) NOT NULL,
        status             TEXT        NOT NULL DEFAULT 'pending'
          CONSTRAINT payment_webhooks_status_check CHECK (status IN ('pending','confirmed','rejected')),
        raw_payload        JSONB       NOT NULL DEFAULT '{}',
        processed_at       TIMESTAMPTZ,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_partner_status
        ON subscriptions (partner_id, status)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_partner
        ON invoices (partner_id, created_at DESC)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_webhooks_invoice
        ON payment_webhooks (invoice_id)
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON invoices TO reclaim_app
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON payment_webhooks TO reclaim_app
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_payment_webhooks_invoice`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_partner`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_partner_status`);
        await queryRunner.query(`DROP TABLE IF EXISTS payment_webhooks`);
        await queryRunner.query(`DROP TABLE IF EXISTS invoices`);
        await queryRunner.query(`
      ALTER TABLE subscriptions
        DROP COLUMN IF EXISTS cancelled_at,
        DROP COLUMN IF EXISTS grace_period_ends_at,
        DROP COLUMN IF EXISTS trial_ends_at,
        DROP COLUMN IF EXISTS plan_type,
        DROP COLUMN IF EXISTS status
    `);
    }
}
exports.BillingSubscription1750300000000 = BillingSubscription1750300000000;
//# sourceMappingURL=1750300000000-BillingSubscription.js.map