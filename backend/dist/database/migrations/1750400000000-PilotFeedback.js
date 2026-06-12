"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PilotFeedback1750400000000 = void 0;
class PilotFeedback1750400000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id   UUID        REFERENCES partners(id) ON DELETE SET NULL,
        user_id      UUID,
        user_role    TEXT,
        type         TEXT        NOT NULL
          CONSTRAINT feedback_type_check CHECK (type IN ('bug','question','suggestion')),
        title        TEXT        NOT NULL,
        body         TEXT,
        page_url     TEXT,
        status       TEXT        NOT NULL DEFAULT 'open'
          CONSTRAINT feedback_status_check CHECK (status IN ('open','acknowledged','resolved')),
        admin_note   TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS feedback_partner_id_idx ON feedback (partner_id)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS feedback_open_idx ON feedback (created_at DESC) WHERE status != 'resolved'`);
        await queryRunner.query(`GRANT SELECT, INSERT, UPDATE ON feedback TO reclaim_app`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS feedback`);
    }
}
exports.PilotFeedback1750400000000 = PilotFeedback1750400000000;
//# sourceMappingURL=1750400000000-PilotFeedback.js.map