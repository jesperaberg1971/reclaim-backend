"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOcrStatusValues1749088800000 = void 0;
class AddOcrStatusValues1749088800000 {
    constructor() {
        this.name = 'AddOcrStatusValues1749088800000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE expenses DROP CONSTRAINT expenses_status_check`);
        await queryRunner.query(`
      ALTER TABLE expenses
        ADD CONSTRAINT expenses_status_check
        CHECK (status IN (
          'pending_ocr',
          'processing',
          'complete',
          'needs_review',
          'failed',
          'approved',
          'rejected',
          'erp_exported'
        ))
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE expenses DROP CONSTRAINT expenses_status_check`);
        await queryRunner.query(`
      ALTER TABLE expenses
        ADD CONSTRAINT expenses_status_check
        CHECK (status IN ('pending','approved','needs_review','rejected','erp_exported'))
    `);
    }
}
exports.AddOcrStatusValues1749088800000 = AddOcrStatusValues1749088800000;
//# sourceMappingURL=1749088800000-AddOcrStatusValues.js.map