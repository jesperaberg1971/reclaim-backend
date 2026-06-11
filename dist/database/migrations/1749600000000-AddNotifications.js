"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddNotifications1749600000000 = void 0;
class AddNotifications1749600000000 {
    async up(qr) {
        await qr.query(`
      CREATE TABLE notifications (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type          VARCHAR(32) NOT NULL CHECK (type IN ('ready_for_review','expense_approved','expense_rejected')),
        title         VARCHAR(200) NOT NULL,
        body          TEXT        NOT NULL,
        resource_type VARCHAR(32),
        resource_id   UUID,
        read_at       TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await qr.query(`
      CREATE INDEX idx_notifications_user_unread
        ON notifications (user_id, created_at DESC)
        WHERE read_at IS NULL
    `);
        await qr.query(`
      CREATE TABLE notification_settings (
        user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await qr.query(`GRANT SELECT, INSERT, UPDATE ON notifications TO reclaim_app`);
        await qr.query(`GRANT SELECT, INSERT, UPDATE ON notification_settings TO reclaim_app`);
    }
    async down(qr) {
        await qr.query(`DROP TABLE IF EXISTS notification_settings`);
        await qr.query(`DROP TABLE IF EXISTS notifications`);
    }
}
exports.AddNotifications1749600000000 = AddNotifications1749600000000;
//# sourceMappingURL=1749600000000-AddNotifications.js.map