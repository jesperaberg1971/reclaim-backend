"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(dataSource, configService) {
        this.dataSource = dataSource;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async getNotifications(userId) {
        const rows = await this.dataSource.query(`SELECT id, type, title, body, resource_type, resource_id, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`, [userId]);
        return rows.map(this.toNotification);
    }
    async getUnreadCount(userId) {
        const [{ count }] = await this.dataSource.query(`SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`, [userId]);
        return Number(count);
    }
    async markRead(notificationId, userId) {
        await this.dataSource.query(`UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`, [notificationId, userId]);
    }
    async markAllRead(userId) {
        await this.dataSource.query(`UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`, [userId]);
    }
    async getSettings(userId) {
        const [row] = await this.dataSource.query(`SELECT email_enabled FROM notification_settings WHERE user_id = $1`, [userId]);
        return { email_enabled: Boolean(row?.email_enabled ?? false) };
    }
    async updateSettings(userId, emailEnabled) {
        await this.dataSource.query(`INSERT INTO notification_settings (user_id, email_enabled, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET email_enabled = EXCLUDED.email_enabled, updated_at = NOW()`, [userId, emailEnabled]);
        return { email_enabled: emailEnabled };
    }
    async notifyReadyForReview(tenantId, expenseId) {
        try {
            const ctx = await this.fetchNotificationContext(tenantId, expenseId);
            if (!ctx)
                return;
            const title = 'Biên lai mới cần phê duyệt';
            const body = `${ctx.expense.employeeName} (${ctx.expense.clientName}) đã nộp biên lai cần xem xét.`;
            await this.createForUsers(ctx.admins.map(a => a.id), 'ready_for_review', title, body, 'expense', expenseId);
            await this.dispatchEmails(ctx.admins, `[Reclaim!] ${title}`, `<p>${body}</p><p><a href="/api/accounting/dashboard">Mở bảng điều khiển</a></p>`);
        }
        catch (e) {
            this.logger.warn(`notifyReadyForReview failed: ${e.message}`);
        }
    }
    async notifyManagerApprovalRequired(tenantId, expenseId) {
        try {
            const [expRow] = await this.dataSource.query(`SELECT e.client_id, emp.full_name AS employee_name, c.name AS client_name
         FROM expenses e
         JOIN employees emp ON emp.id = e.employee_id
         JOIN clients c     ON c.id   = e.client_id
         WHERE e.id = $1 LIMIT 1`, [expenseId]);
            if (!expRow)
                return;
            const managers = await this.dataSource.query(`SELECT id, email FROM users
         WHERE role = 'client_admin' AND partner_id = $1 AND client_id = $2`, [tenantId, expRow.client_id]);
            if (!managers.length)
                return;
            const title = 'Biên lai cần phê duyệt của quản lý';
            const body = `${expRow.employee_name} (${expRow.client_name}) đã nộp biên lai cần phê duyệt của bạn.`;
            await this.createForUsers(managers.map(m => m.id), 'manager_approval_required', title, body, 'expense', expenseId);
            await this.dispatchEmails(managers, `[Reclaim!] ${title}`, `<p>${body}</p>`);
        }
        catch (e) {
            this.logger.warn(`notifyManagerApprovalRequired failed: ${e.message}`);
        }
    }
    async notifyAccountantStepReady(tenantId, expenseId) {
        try {
            const ctx = await this.fetchNotificationContext(tenantId, expenseId);
            if (!ctx)
                return;
            const title = 'Biên lai sẵn sàng để kế toán phê duyệt';
            const body = `${ctx.expense.employeeName} (${ctx.expense.clientName}): quản lý đã phê duyệt, cần xem xét kế toán.`;
            await this.createForUsers(ctx.admins.map(a => a.id), 'accountant_step_ready', title, body, 'expense', expenseId);
            await this.dispatchEmails(ctx.admins, `[Reclaim!] ${title}`, `<p>${body}</p>`);
        }
        catch (e) {
            this.logger.warn(`notifyAccountantStepReady failed: ${e.message}`);
        }
    }
    async notifyExpenseDecision(expenseId, tenantId, decision, note) {
        try {
            const ctx = await this.fetchNotificationContext(tenantId, expenseId);
            if (!ctx)
                return;
            const isApproved = decision === 'approved';
            const title = isApproved ? 'Biên lai đã được phê duyệt' : 'Biên lai đã bị từ chối';
            const body = `${ctx.expense.employeeName} (${ctx.expense.clientName}): biên lai ${expenseId.slice(0, 8)}…`
                + (note ? ` — Ghi chú: ${note}` : '');
            await this.createForUsers(ctx.admins.map(a => a.id), isApproved ? 'expense_approved' : 'expense_rejected', title, body, 'expense', expenseId);
            await this.dispatchEmails(ctx.admins, `[Reclaim!] ${title}`, `<p>${body}</p>`);
        }
        catch (e) {
            this.logger.warn(`notifyExpenseDecision failed: ${e.message}`);
        }
    }
    async fetchNotificationContext(tenantId, expenseId) {
        const admins = await this.dataSource.query(`SELECT u.id, u.email FROM users u WHERE u.role = 'partner_admin' AND u.partner_id = $1`, [tenantId]);
        if (!admins.length)
            return null;
        const [row] = await this.dataSource.query(`SELECT emp.full_name AS employee_name, c.name AS client_name
       FROM expenses e
       JOIN employees emp ON emp.id = e.employee_id
       JOIN clients   c   ON c.id   = e.client_id
       WHERE e.id = $1 LIMIT 1`, [expenseId]);
        if (!row)
            return null;
        return {
            admins,
            expense: { employeeName: row.employee_name, clientName: row.client_name },
        };
    }
    async dispatchEmails(admins, subject, html) {
        if (!admins.length)
            return;
        const settings = await this.dataSource.query(`SELECT user_id, email_enabled FROM notification_settings WHERE user_id = ANY($1)`, [admins.map(a => a.id)]);
        const enabled = new Set(settings.filter(s => s.email_enabled).map(s => s.user_id));
        for (const admin of admins) {
            if (enabled.has(admin.id))
                void this.sendEmail(admin.email, subject, html);
        }
    }
    async createForUsers(userIds, type, title, body, resourceType, resourceId) {
        if (!userIds.length)
            return;
        const values = userIds
            .map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`)
            .join(', ');
        const params = userIds.flatMap((id) => [id, type, title, body, resourceType, resourceId]);
        await this.dataSource.query(`INSERT INTO notifications (user_id, type, title, body, resource_type, resource_id)
       VALUES ${values}`, params);
    }
    async sendEmail(to, subject, html) {
        const apiKey = this.configService.get('RESEND_API_KEY');
        const from = this.configService.get('EMAIL_FROM', 'noreply@reclaim.vn');
        if (!apiKey) {
            this.logger.debug(`[Email] (no RESEND_API_KEY set) To: ${to} | Subject: ${subject}`);
            return;
        }
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, subject, html }),
            });
            if (!res.ok) {
                const err = await res.text().catch(() => res.status.toString());
                this.logger.warn(`Email to ${to} failed: ${err}`);
            }
        }
        catch (e) {
            this.logger.warn(`Email send error: ${e.message}`);
        }
    }
    toNotification(r) {
        return {
            id: r.id,
            type: r.type,
            title: r.title,
            body: r.body,
            resource_type: r.resource_type ?? null,
            resource_id: r.resource_id ?? null,
            read_at: r.read_at ? new Date(r.read_at).toISOString() : null,
            created_at: new Date(r.created_at).toISOString(),
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map