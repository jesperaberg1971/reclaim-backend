"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase3PerformanceIndexes1750200000000 = void 0;
class Phase3PerformanceIndexes1750200000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_employee_created
        ON expenses (employee_id, created_at DESC)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_steps_expense_order
        ON expense_approval_steps (expense_id, step_order)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created
        ON audit_logs (created_at DESC)
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_approval_steps_expense_order`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_employee_created`);
    }
}
exports.Phase3PerformanceIndexes1750200000000 = Phase3PerformanceIndexes1750200000000;
//# sourceMappingURL=1750200000000-Phase3PerformanceIndexes.js.map