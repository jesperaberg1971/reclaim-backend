"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalChain1749950000000 = void 0;
class ApprovalChain1749950000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE expense_approval_steps (
        id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        expense_id  UUID         NOT NULL REFERENCES expenses(id)  ON DELETE CASCADE,
        partner_id  UUID         NOT NULL REFERENCES partners(id)  ON DELETE CASCADE,
        step_order  SMALLINT     NOT NULL,
        step_type   VARCHAR(20)  NOT NULL CHECK (step_type IN ('manager', 'accountant')),
        status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
        decided_by  UUID,
        decided_at  TIMESTAMPTZ,
        note        TEXT,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        UNIQUE (expense_id, step_order)
      )
    `);
        await queryRunner.query(`ALTER TABLE expense_approval_steps ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY tenant_isolation ON expense_approval_steps
        USING (partner_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
        await queryRunner.query(`GRANT SELECT, INSERT, UPDATE ON expense_approval_steps TO reclaim_app`);
        await queryRunner.query(`CREATE INDEX idx_approval_steps_expense ON expense_approval_steps (expense_id)`);
        await queryRunner.query(`
      CREATE INDEX idx_approval_steps_pending
        ON expense_approval_steps (partner_id, step_type)
        WHERE status = 'pending'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS expense_approval_steps`);
    }
}
exports.ApprovalChain1749950000000 = ApprovalChain1749950000000;
//# sourceMappingURL=1749950000000-ApprovalChain.js.map