"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExpenseComments1749700000000 = void 0;
class AddExpenseComments1749700000000 {
    async up(qr) {
        await qr.query(`
      CREATE TABLE expense_comments (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID        NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        body       TEXT        NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await qr.query(`
      CREATE INDEX idx_expense_comments_expense
        ON expense_comments (expense_id, created_at ASC)
    `);
        await qr.query(`GRANT SELECT, INSERT ON expense_comments TO reclaim_app`);
    }
    async down(qr) {
        await qr.query(`DROP TABLE IF EXISTS expense_comments`);
    }
}
exports.AddExpenseComments1749700000000 = AddExpenseComments1749700000000;
//# sourceMappingURL=1749700000000-AddExpenseComments.js.map