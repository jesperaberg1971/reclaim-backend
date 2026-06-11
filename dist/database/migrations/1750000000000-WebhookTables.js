"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookTables1750000000000 = void 0;
class WebhookTables1750000000000 {
    constructor() {
        this.name = 'WebhookTables1750000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id  UUID        NOT NULL,
        url         TEXT        NOT NULL,
        secret      TEXT        NOT NULL,
        events      TEXT[]      NOT NULL DEFAULT '{}',
        is_active   BOOLEAN     NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(partner_id, url)
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id       UUID        NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
        event             TEXT        NOT NULL,
        payload           JSONB       NOT NULL,
        status            TEXT        NOT NULL DEFAULT 'pending',
        response_status   INT,
        response_body     TEXT,
        attempts          INT         NOT NULL DEFAULT 0,
        last_attempted_at TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries (endpoint_id)`);
        await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_endpoints TO reclaim_app`);
        await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_deliveries TO reclaim_app`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS webhook_deliveries`);
        await queryRunner.query(`DROP TABLE IF EXISTS webhook_endpoints`);
    }
}
exports.WebhookTables1750000000000 = WebhookTables1750000000000;
//# sourceMappingURL=1750000000000-WebhookTables.js.map