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
exports.MobileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const mobile_service_1 = require("./mobile.service");
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/tiff',
    'image/bmp', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf',
]);
const ALLOWED_TYPES_DISPLAY = 'JPEG, PNG, HEIC, WebP, TIFF, BMP, or PDF';
let MobileController = class MobileController {
    constructor(mobileService) {
        this.mobileService = mobileService;
    }
    async uploadReceipt(file, employeeId, idempotencyKey, req) {
        if (!file) {
            throw new common_1.BadRequestException(`No file received. Please attach a receipt image or PDF using the "image" field. ` +
                `Accepted formats: ${ALLOWED_TYPES_DISPLAY}.`);
        }
        return this.mobileService.enqueueReceiptUpload(file, req.user, employeeId, idempotencyKey);
    }
    async uploadReceiptsBatch(files, employeeId, idempotencyKeysRaw, req) {
        if (!files?.length) {
            throw new common_1.BadRequestException(`No files received. Attach receipts using the "images" field (multipart/form-data). ` +
                `Accepted formats: ${ALLOWED_TYPES_DISPLAY}.`);
        }
        if (files.length > mobile_service_1.MAX_BATCH_SIZE) {
            throw new common_1.BadRequestException(`Batch upload accepts at most ${mobile_service_1.MAX_BATCH_SIZE} files per request.`);
        }
        const idempotencyKeys = idempotencyKeysRaw
            ? (Array.isArray(idempotencyKeysRaw) ? idempotencyKeysRaw : [idempotencyKeysRaw])
            : [];
        return this.mobileService.batchUploadReceipts(files, req.user, employeeId, idempotencyKeys);
    }
    async listExpenses(since, status, employeeId, limitRaw, offsetRaw, req) {
        return this.mobileService.getExpenseList(req.user, {
            since,
            status,
            employeeId,
            limit: limitRaw ? parseInt(limitRaw, 10) : undefined,
            offset: offsetRaw ? parseInt(offsetRaw, 10) : undefined,
        });
    }
    async getProfile(req) {
        return this.mobileService.getEmployeeProfile(req.user?.clientId);
    }
    async getStatus(expenseId, req) {
        return this.mobileService.getExpenseStatus(expenseId, req.user.tenantId);
    }
};
exports.MobileController = MobileController;
__decorate([
    (0, common_1.Post)('upload-receipt'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        limits: { fileSize: 20 * 1024 * 1024, files: 1 },
        fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException(`File type "${file.mimetype}" is not supported. ` +
                    `Please upload a ${ALLOWED_TYPES_DISPLAY} file.`), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('employeeId')),
    __param(2, (0, common_1.Body)('idempotency_key')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "uploadReceipt", null);
__decorate([
    (0, common_1.Post)('upload-receipts/batch'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', mobile_service_1.MAX_BATCH_SIZE, {
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('employeeId')),
    __param(2, (0, common_1.Body)('idempotency_keys')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "uploadReceiptsBatch", null);
__decorate([
    (0, common_1.Get)('expenses'),
    __param(0, (0, common_1.Query)('since')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('employeeId')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "listExpenses", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('status/:expenseId'),
    __param(0, (0, common_1.Param)('expenseId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MobileController.prototype, "getStatus", null);
exports.MobileController = MobileController = __decorate([
    (0, common_1.Controller)('mobile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [mobile_service_1.MobileService])
], MobileController);
//# sourceMappingURL=mobile.controller.js.map