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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const feedback_service_1 = require("./feedback.service");
const feedback_widget_1 = require("./feedback.widget");
const feedback_admin_html_1 = require("./feedback.admin.html");
let FeedbackController = class FeedbackController {
    constructor(feedbackService) {
        this.feedbackService = feedbackService;
    }
    getWidget(res) {
        res.send((0, feedback_widget_1.buildFeedbackWidgetJs)());
    }
    getAdminPage(res) {
        res.send((0, feedback_admin_html_1.buildFeedbackAdminHtml)());
    }
    async getPilotSummary(partnerIds, from, to) {
        const ids = (partnerIds ?? '').split(',').map((s) => s.trim()).filter(Boolean);
        return this.feedbackService.getPilotSummary(ids, from, to);
    }
    async list(query) {
        const q = {};
        if (query.status)
            q.status = query.status;
        if (query.type)
            q.type = query.type;
        if (query.partner_id)
            q.partner_id = query.partner_id;
        if (query.limit)
            q.limit = +query.limit;
        if (query.offset)
            q.offset = +query.offset;
        return this.feedbackService.list(q);
    }
    async create(body, req) {
        const { partnerId = null, userId = null, role = null } = req.user ?? {};
        return this.feedbackService.create(body, {
            partnerId,
            userId,
            userRole: role,
        });
    }
    async updateStatus(id, body) {
        return this.feedbackService.updateStatus(id, body.status, body.admin_note);
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Get)('widget.js'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'application/javascript; charset=utf-8'),
    (0, common_1.Header)('Cache-Control', 'public, max-age=3600'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "getWidget", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "getAdminPage", null);
__decorate([
    (0, common_1.Get)('pilot-summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Query)('partner_ids')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "getPilotSummary", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [feedback_service_1.CreateFeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "updateStatus", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('feedback'),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map