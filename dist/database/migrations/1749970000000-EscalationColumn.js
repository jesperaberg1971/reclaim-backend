"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationColumn1749970000000 = void 0;
class EscalationColumn1749970000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE expense_approval_steps
        ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN NOT NULL DEFAULT false
    `);
        await queryRunner.query(`
      COMMENT ON COLUMN expense_approval_steps.is_escalated
        IS 'True when the step was skipped automatically due to approval timeout'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE expense_approval_steps DROP COLUMN IF EXISTS is_escalated
    `);
    }
}
exports.EscalationColumn1749970000000 = EscalationColumn1749970000000;
//# sourceMappingURL=1749970000000-EscalationColumn.js.map