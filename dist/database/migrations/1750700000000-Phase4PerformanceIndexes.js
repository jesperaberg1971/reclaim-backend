"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase4PerformanceIndexes1750700000000 = void 0;
class Phase4PerformanceIndexes1750700000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_export_ready
        ON expenses (receipt_date, client_id)
        WHERE status = 'approved' AND erp_exported = false
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_partners_created
        ON partners (created_at DESC)
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_steps_queue_order
        ON expense_approval_steps (partner_id, created_at)
        WHERE status = 'pending'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_approval_steps_queue_order`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_partners_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_export_ready`);
    }
}
exports.Phase4PerformanceIndexes1750700000000 = Phase4PerformanceIndexes1750700000000;
//# sourceMappingURL=1750700000000-Phase4PerformanceIndexes.js.map