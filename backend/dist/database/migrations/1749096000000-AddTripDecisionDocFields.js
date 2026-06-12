"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTripDecisionDocFields1749096000000 = void 0;
class AddTripDecisionDocFields1749096000000 {
    constructor() {
        this.name = 'AddTripDecisionDocFields1749096000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE trip_decisions
        ADD COLUMN destination VARCHAR,
        ADD COLUMN purpose     TEXT
    `);
        await queryRunner.query(`
      ALTER TABLE expenses
        ADD COLUMN supporting_documents JSONB NOT NULL DEFAULT '[]'
    `);
        await queryRunner.query(`
      GRANT SELECT, INSERT, UPDATE ON trip_decisions TO reclaim_app
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE expenses DROP COLUMN IF EXISTS supporting_documents`);
        await queryRunner.query(`ALTER TABLE trip_decisions DROP COLUMN IF EXISTS destination`);
        await queryRunner.query(`ALTER TABLE trip_decisions DROP COLUMN IF EXISTS purpose`);
    }
}
exports.AddTripDecisionDocFields1749096000000 = AddTripDecisionDocFields1749096000000;
//# sourceMappingURL=1749096000000-AddTripDecisionDocFields.js.map