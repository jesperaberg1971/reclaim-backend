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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let CommentsService = class CommentsService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getComments(expenseId, tenantId, clientId) {
        const params = [expenseId, tenantId];
        const clientClause = clientId ? `AND e.client_id = $${params.push(clientId)}` : '';
        const rows = await this.dataSource.query(`SELECT ec.id, ec.expense_id, ec.body, ec.created_at,
              u.id AS user_id, u.email AS user_email, u.role AS user_role
       FROM expense_comments ec
       JOIN expenses  e ON e.id   = ec.expense_id
       JOIN clients   c ON c.id   = e.client_id
       JOIN users     u ON u.id   = ec.user_id
       WHERE ec.expense_id = $1
         AND c.partner_id  = $2
         ${clientClause}
       ORDER BY ec.created_at ASC`, params);
        return rows.map(this.toComment);
    }
    async addComment(expenseId, userId, body, tenantId, clientId) {
        const trimmed = body?.trim();
        if (!trimmed || trimmed.length < 1 || trimmed.length > 2000) {
            throw new common_1.BadRequestException('Comment must be 1–2000 characters');
        }
        const verifyParams = [expenseId, tenantId];
        const clientClause = clientId ? `AND e.client_id = $${verifyParams.push(clientId)}` : '';
        const [expense] = await this.dataSource.query(`SELECT e.id FROM expenses e
       JOIN clients c ON c.id = e.client_id
       WHERE e.id = $1 AND c.partner_id = $2 ${clientClause}
       LIMIT 1`, verifyParams);
        if (!expense)
            throw new common_1.NotFoundException(`Expense ${expenseId} not found`);
        const [comment] = await this.dataSource.query(`WITH inserted AS (
         INSERT INTO expense_comments (expense_id, user_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, expense_id, body, created_at
       )
       SELECT i.id, i.expense_id, i.body, i.created_at,
              u.id AS user_id, u.email AS user_email, u.role AS user_role
       FROM inserted i
       JOIN users u ON u.id = $2`, [expenseId, userId, trimmed]);
        return this.toComment(comment);
    }
    async getCommentsByExpenseIds(expenseIds, tenantId) {
        const map = new Map();
        if (!expenseIds.length)
            return map;
        const rows = await this.dataSource.query(`SELECT ec.id, ec.expense_id, ec.body, ec.created_at,
              u.id AS user_id, u.email AS user_email, u.role AS user_role
       FROM expense_comments ec
       JOIN expenses  e ON e.id   = ec.expense_id
       JOIN clients   c ON c.id   = e.client_id
       JOIN users     u ON u.id   = ec.user_id
       WHERE ec.expense_id = ANY($1::uuid[])
         AND c.partner_id  = $2
       ORDER BY ec.created_at ASC`, [expenseIds, tenantId]);
        for (const row of rows) {
            const list = map.get(row.expense_id) ?? [];
            list.push(this.toComment(row));
            map.set(row.expense_id, list);
        }
        return map;
    }
    toComment(r) {
        return {
            id: r.id,
            expense_id: r.expense_id,
            user_id: r.user_id,
            user_email: r.user_email ?? '',
            user_role: r.user_role ?? '',
            body: r.body,
            created_at: new Date(r.created_at).toISOString(),
        };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], CommentsService);
//# sourceMappingURL=comments.service.js.map