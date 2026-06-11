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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackService = exports.CreateFeedbackDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const date_1 = require("../../common/utils/date");
class CreateFeedbackDto {
}
exports.CreateFeedbackDto = CreateFeedbackDto;
__decorate([
    (0, class_validator_1.IsIn)(['bug', 'question', 'suggestion']),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "page_url", void 0);
const VALID_TYPES = new Set(['bug', 'question', 'suggestion']);
const VALID_STATUSES = new Set(['open', 'acknowledged', 'resolved']);
let FeedbackService = class FeedbackService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async create(dto, context) {
        if (!dto.title?.trim())
            throw new common_1.BadRequestException('Tiêu đề không được để trống');
        if (!VALID_TYPES.has(dto.type)) {
            throw new common_1.BadRequestException('Loại phản hồi không hợp lệ: bug | question | suggestion');
        }
        const rows = await this.dataSource.query(`INSERT INTO feedback (partner_id, user_id, user_role, type, title, body, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, partner_id, user_id, user_role, type, title, body, page_url, status, admin_note, created_at`, [
            context.partnerId ?? null,
            context.userId ?? null,
            context.userRole ?? null,
            dto.type,
            dto.title.trim(),
            dto.body?.trim() ?? null,
            dto.page_url?.trim() ?? null,
        ]);
        const r = rows[0];
        return this.toItem(r, null);
    }
    async list(query) {
        const conditions = [];
        const params = [];
        let i = 1;
        if (query.status) {
            conditions.push(`f.status = $${i++}`);
            params.push(query.status);
        }
        if (query.type) {
            conditions.push(`f.type = $${i++}`);
            params.push(query.type);
        }
        if (query.partner_id) {
            conditions.push(`f.partner_id = $${i++}`);
            params.push(query.partner_id);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countRow = await this.dataSource.query(`SELECT COUNT(*)::int AS total FROM feedback f ${where}`, params);
        const total = countRow[0].total;
        params.push(query.limit ?? 50, query.offset ?? 0);
        const rows = await this.dataSource.query(`SELECT f.id, f.partner_id, f.user_id, f.user_role,
              f.type, f.title, f.body, f.page_url,
              f.status, f.admin_note, f.created_at,
              p.name AS partner_name
       FROM feedback f
       LEFT JOIN partners p ON p.id = f.partner_id
       ${where}
       ORDER BY f.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`, params);
        return {
            total,
            items: rows.map(r => this.toItem(r, r.partner_name)),
        };
    }
    async updateStatus(id, status, adminNote) {
        if (!VALID_STATUSES.has(status)) {
            throw new common_1.BadRequestException('Trạng thái không hợp lệ: open | acknowledged | resolved');
        }
        const setClauses = ['status = $1'];
        const params = [status];
        let i = 2;
        if (adminNote !== undefined) {
            setClauses.push(`admin_note = $${i++}`);
            params.push(adminNote.trim() || null);
        }
        params.push(id);
        const rows = await this.dataSource.query(`UPDATE feedback SET ${setClauses.join(', ')} WHERE id = $${i}
       RETURNING id, partner_id, user_id, user_role, type, title, body, page_url, status, admin_note, created_at`, params);
        if (!rows.length)
            throw new common_1.NotFoundException(`Feedback ${id} not found`);
        const r = rows[0];
        let partnerName = null;
        if (r.partner_id) {
            const pRows = await this.dataSource.query(`SELECT name FROM partners WHERE id = $1`, [r.partner_id]);
            partnerName = pRows[0]?.name ?? null;
        }
        return this.toItem(r, partnerName);
    }
    async getPilotSummary(partnerIds, from, to) {
        if (!partnerIds.length)
            return [];
        const f = from ?? new Date(Date.now() - 7 * 86_400_000).toISOString();
        const t = to ?? new Date().toISOString();
        const placeholders = partnerIds.map((_, i) => `$${i + 3}`).join(', ');
        const rows = await this.dataSource.query(`SELECT
         p.id                                                     AS partner_id,
         p.name                                                   AS partner_name,
         p.is_active,
         COUNT(DISTINCT c.id)::int                               AS client_count,
         COUNT(DISTINCT e.id) FILTER (WHERE em.is_active)::int  AS active_employees,
         COUNT(DISTINCT ex.id)::int                              AS total_expenses,
         COUNT(DISTINCT ex.id) FILTER (
           WHERE ex.created_at BETWEEN $1 AND $2)::int           AS expenses_in_period,
         COUNT(DISTINCT ex.id) FILTER (
           WHERE ex.status = 'pending')::int                     AS pending_expenses,
         COUNT(DISTINCT ex.id) FILTER (
           WHERE ex.status = 'approved')::int                    AS approved_expenses,
         COALESCE(SUM(ex.original_amount),0)::text               AS total_amount_vnd,
         MAX(al.created_at)::text                                AS last_activity,
         s.status                                                AS subscription_status,
         COUNT(DISTINCT fb.id)::int                              AS open_feedback
       FROM partners p
       LEFT JOIN clients        c  ON c.partner_id  = p.id
       LEFT JOIN employees      em ON em.client_id  = c.id
       LEFT JOIN expenses       ex ON ex.client_id  = c.id
       LEFT JOIN audit_logs     al ON al.tenant_id  = p.id
       LEFT JOIN subscriptions  s  ON s.partner_id  = p.id
       LEFT JOIN feedback       fb ON fb.partner_id = p.id AND fb.status = 'open'
       WHERE p.id IN (${placeholders})
       GROUP BY p.id, p.name, p.is_active, s.status
       ORDER BY p.name`, [f, t, ...partnerIds]);
        return rows.map(r => ({
            partner_id: r.partner_id,
            partner_name: r.partner_name,
            is_active: r.is_active,
            client_count: r.client_count,
            active_employees: r.active_employees,
            total_expenses: r.total_expenses,
            expenses_in_period: r.expenses_in_period,
            pending_expenses: r.pending_expenses,
            approved_expenses: r.approved_expenses,
            total_amount_vnd: r.total_amount_vnd,
            last_activity: r.last_activity ? (0, date_1.toIso)(new Date(r.last_activity)) : null,
            subscription_status: r.subscription_status ?? null,
            open_feedback: r.open_feedback,
        }));
    }
    toItem(r, partnerName) {
        return {
            id: r.id,
            partner_id: r.partner_id ?? null,
            partner_name: partnerName ?? null,
            user_id: r.user_id ?? null,
            user_role: r.user_role ?? null,
            type: r.type,
            title: r.title,
            body: r.body ?? null,
            page_url: r.page_url ?? null,
            status: r.status,
            admin_note: r.admin_note ?? null,
            created_at: (0, date_1.toIso)(r.created_at),
        };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map