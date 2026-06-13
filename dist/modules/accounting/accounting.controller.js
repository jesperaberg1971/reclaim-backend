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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AccountingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const audit_service_1 = require("../../common/audit/audit.service");
const accounting_service_1 = require("./accounting.service");
const comments_service_1 = require("./comments.service");
const accounting_html_1 = require("./accounting.html");
const document_zip_query_dto_1 = require("./dto/document-zip-query.dto");
const add_comment_dto_1 = require("./dto/add-comment.dto");
const expense_note_dto_1 = require("./dto/expense-note.dto");
const list_expenses_query_dto_1 = require("./dto/list-expenses-query.dto");
const summary_query_dto_1 = require("./dto/summary-query.dto");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
let AccountingController = AccountingController_1 = class AccountingController {
    constructor(service, commentsService, auditService) {
        this.service = service;
        this.commentsService = commentsService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(AccountingController_1.name);
    }
    dashboard(res) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send((0, accounting_html_1.buildAccountingHtml)());
    }
    async listExpenses(req, dto) {
        const filters = {
            from: dto.from,
            to: dto.to,
            clientId: dto.clientId,
            employeeId: dto.employeeId,
            gate: dto.gate,
            status: dto.status,
            statusFilter: dto.statusFilter,
            approvalDecision: dto.approvalDecision,
            search: dto.search,
            page: dto.page,
            limit: dto.limit,
        };
        return this.service.listExpenses(req.user.tenantId, filters);
    }
    async unmarkReviewed(id, req) {
        await this.service.unmarkReviewed(id, req.user.tenantId);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'accountant_review',
            resourceType: 'expense',
            resourceId: id,
            metadata: { undone: true },
        });
        return { ok: true, expenseId: id, status: 'review_cleared' };
    }
    async rejectExpense(id, req, dto) {
        await this.service.rejectExpense(id, req.user.tenantId, req.user.userId, dto.note);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'expense_reject',
            resourceType: 'expense',
            resourceId: id,
            metadata: { note: dto.note ?? null },
        });
        return { ok: true, expenseId: id, decision: 'rejected', decidedAt: new Date().toISOString() };
    }
    async markReviewed(id, req, dto) {
        await this.service.markReviewed(id, req.user.tenantId, req.user.userId, dto.note);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'expense_approve',
            resourceType: 'expense',
            resourceId: id,
            metadata: { note: dto.note ?? null },
        });
        return { ok: true, expenseId: id, decision: 'approved', decidedAt: new Date().toISOString() };
    }
    async getDetail(id, req) {
        return this.service.getExpenseDetail(id, req.user.tenantId);
    }
    async getComments(id, req) {
        const clientId = req.user.role === 'client_admin' ? req.user.clientId : undefined;
        return this.commentsService.getComments(id, req.user.tenantId, clientId);
    }
    async addComment(id, req, dto) {
        const clientId = req.user.role === 'client_admin' ? req.user.clientId : undefined;
        return this.commentsService.addComment(id, req.user.userId, dto.body, req.user.tenantId, clientId);
    }
    async listClients(req) {
        return this.service.listClients(req.user.tenantId);
    }
    async listEmployees(req) {
        return this.service.listEmployees(req.user.tenantId);
    }
    async getDashboardMetrics(req, q) {
        const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
        if (q.from && !ISO_DATE.test(q.from))
            throw new common_1.BadRequestException('from must be YYYY-MM-DD');
        if (q.to && !ISO_DATE.test(q.to))
            throw new common_1.BadRequestException('to must be YYYY-MM-DD');
        const now = new Date();
        const from = q.from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const to = q.to ?? now.toISOString().slice(0, 10);
        return this.service.getDashboardMetrics(req.user.tenantId, from, to);
    }
    async getRecentExports(req) {
        return this.service.getRecentExports(req.user.tenantId);
    }
    async downloadDocZip(req, dto, res) {
        const { buffer, filename, expenseCount, fileCount, commentCount } = await this.service.buildDocumentZip(req.user.tenantId, dto.from, dto.to, dto.clientId);
        this.logger.log(`[DocZip] tenant=${req.user.tenantId} from=${dto.from} to=${dto.to} ` +
            `expenses=${expenseCount} files=${fileCount} comments=${commentCount} bytes=${buffer.length}`);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('X-Expense-Count', expenseCount);
        res.setHeader('X-File-Count', fileCount);
        res.setHeader('X-Comment-Count', commentCount);
        res.send(buffer);
    }
    async getSummary(req, dto) {
        const result = await this.service.getPeriodSummary(req.user.tenantId, dto.from, dto.to, dto.clientId);
        void this.auditService.log({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            ipAddress: req.ip,
            action: 'accounting_export',
            metadata: { from: dto.from, to: dto.to, clientId: dto.clientId, expense_count: result.expense_count },
        });
        return result;
    }
    async getSpendingBreakdown(req, dto) {
        return this.service.getSpendingBreakdown(req.user.tenantId, dto.from, dto.to, dto.groupBy ?? 'category', dto.clientId);
    }
    async getGatePerformance(req, dto) {
        return this.service.getGatePerformance(req.user.tenantId, dto.from, dto.to, dto.clientId);
    }
    async getClientInsights(req, dto) {
        return this.service.getClientInsights(req.user.tenantId, dto.from, dto.to);
    }
    async exportAnalyticsReport(req, dto, res) {
        const { buffer, filename } = await this.service.exportAnalyticsCsv(req.user.tenantId, dto.from, dto.to, dto.type, dto.groupBy ?? 'category', dto.clientId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('expenses'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_expenses_query_dto_1.ListExpensesQueryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "listExpenses", null);
__decorate([
    (0, common_1.Delete)('expenses/:id/review'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "unmarkReviewed", null);
__decorate([
    (0, common_1.Post)('expenses/:id/reject'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, expense_note_dto_1.ExpenseNoteDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "rejectExpense", null);
__decorate([
    (0, common_1.Patch)('expenses/:id/review'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, expense_note_dto_1.ExpenseNoteDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "markReviewed", null);
__decorate([
    (0, common_1.Get)('expenses/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Get)('expenses/:id/comments'),
    (0, roles_decorator_1.Roles)('partner_admin', 'client_admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getComments", null);
__decorate([
    (0, common_1.Post)('expenses/:id/comments'),
    (0, roles_decorator_1.Roles)('partner_admin', 'client_admin'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, add_comment_dto_1.AddCommentDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "listClients", null);
__decorate([
    (0, common_1.Get)('employees'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "listEmployees", null);
__decorate([
    (0, common_1.Get)('dashboard-metrics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getDashboardMetrics", null);
__decorate([
    (0, common_1.Get)('recent-exports'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getRecentExports", null);
__decorate([
    (0, common_1.Get)('documents/zip'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, document_zip_query_dto_1.DocumentZipQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "downloadDocZip", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, summary_query_dto_1.SummaryQueryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('analytics/spending'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_query_dto_1.SpendingQueryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getSpendingBreakdown", null);
__decorate([
    (0, common_1.Get)('analytics/gate-performance'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_query_dto_1.PerformanceQueryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getGatePerformance", null);
__decorate([
    (0, common_1.Get)('analytics/client-insights'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, summary_query_dto_1.SummaryQueryDto]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "getClientInsights", null);
__decorate([
    (0, common_1.Get)('analytics/report.csv'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_query_dto_1.ReportExportQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AccountingController.prototype, "exportAnalyticsReport", null);
exports.AccountingController = AccountingController = AccountingController_1 = __decorate([
    (0, common_1.Controller)('accounting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, tenant_scope_guard_1.TenantScopeGuard),
    (0, roles_decorator_1.Roles)('partner_admin'),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService,
        comments_service_1.CommentsService,
        audit_service_1.AuditService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map