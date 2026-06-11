"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase2PerformanceIndexes1749800000000 = void 0;
class Phase2PerformanceIndexes1749800000000 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_receipt_date_cast
         ON expenses (receipt_date DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_status_date
         ON expenses (status, receipt_date DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_status_approval
         ON expenses (status, approval_decision)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_full
         ON notifications (user_id, created_at DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action
         ON audit_logs (tenant_id, action, created_at DESC)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_partner_role
         ON users (partner_id, role)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_trip_decisions_employee_dates
         ON trip_decisions (employee_id, start_date, end_date)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_trip_decisions_employee_dates`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_partner_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_tenant_action`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_user_full`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_status_approval`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_status_date`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_expenses_receipt_date_cast`);
    }
}
exports.Phase2PerformanceIndexes1749800000000 = Phase2PerformanceIndexes1749800000000;
//# sourceMappingURL=1749800000000-Phase2PerformanceIndexes.js.map