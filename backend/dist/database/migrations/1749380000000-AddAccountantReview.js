"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAccountantReview1749380000000 = void 0;
class AddAccountantReview1749380000000 {
    async up(qr) {
        await qr.query(`
      ALTER TABLE expenses
        ADD COLUMN IF NOT EXISTS accountant_reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS accountant_reviewed_by UUID,
        ADD COLUMN IF NOT EXISTS reviewer_note          TEXT
    `);
        await qr.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_reviewed
        ON expenses (accountant_reviewed_at)
        WHERE accountant_reviewed_at IS NOT NULL
    `);
        await qr.query(`GRANT SELECT, INSERT, UPDATE ON expenses TO reclaim_app`);
    }
    async down(qr) {
        await qr.query(`
      ALTER TABLE expenses
        DROP COLUMN IF EXISTS accountant_reviewed_at,
        DROP COLUMN IF EXISTS accountant_reviewed_by,
        DROP COLUMN IF EXISTS reviewer_note
    `);
    }
}
exports.AddAccountantReview1749380000000 = AddAccountantReview1749380000000;
//# sourceMappingURL=1749380000000-AddAccountantReview.js.map