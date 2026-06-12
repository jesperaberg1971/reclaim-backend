"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApprovalDecision1749500000000 = void 0;
class AddApprovalDecision1749500000000 {
    async up(qr) {
        await qr.query(`
      ALTER TABLE expenses
        ADD COLUMN IF NOT EXISTS approval_decision VARCHAR(8)
          CHECK (approval_decision IN ('approved', 'rejected'))
    `);
        await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_approval
        ON expenses (approval_decision)
        WHERE approval_decision IS NOT NULL
    `);
    }
    async down(qr) {
        await qr.query(`DROP INDEX IF EXISTS idx_expenses_approval`);
        await qr.query(`ALTER TABLE expenses DROP COLUMN IF EXISTS approval_decision`);
    }
}
exports.AddApprovalDecision1749500000000 = AddApprovalDecision1749500000000;
//# sourceMappingURL=1749500000000-AddApprovalDecision.js.map