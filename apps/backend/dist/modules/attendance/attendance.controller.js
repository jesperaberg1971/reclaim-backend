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
var AttendanceController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const crypto = require("crypto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_scope_guard_1 = require("../../common/guards/tenant-scope.guard");
const attendance_service_1 = require("./attendance.service");
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const photoUpload = {
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new common_1.BadRequestException('Ảnh phải ở định dạng JPEG, PNG hoặc WebP'), false);
        }
    },
};
let AttendanceController = AttendanceController_1 = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
        this.logger = new common_1.Logger(AttendanceController_1.name);
    }
    async checkIn(file, body) {
        if (!file) {
            throw new common_1.BadRequestException('Selfie photo is required');
        }
        if (!body.latitude || !body.longitude || !body.employeeId) {
            throw new common_1.BadRequestException('latitude, longitude and employeeId are required');
        }
        const latitude = parseFloat(body.latitude);
        const longitude = parseFloat(body.longitude);
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new common_1.BadRequestException('Invalid GPS coordinates');
        }
        const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
        const safeFilename = `${crypto.randomUUID()}.${ext}`;
        const bucket = process.env.GCS_BUCKET_NAME ?? process.env.S3_BUCKET_NAME ?? 'reclaim-vn';
        const photoUrl = `https://storage.googleapis.com/${bucket}/attendance/${safeFilename}`;
        const checkin = await this.attendanceService.checkIn(body.employeeId, latitude, longitude, photoUrl);
        this.logger.log(`Check-in recorded for employee ${body.employeeId}`);
        return {
            status: 'success',
            message: 'Check-in recorded successfully',
            checkinId: checkin.id,
            timestamp: checkin.created_at,
        };
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('check-in'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo', photoUpload)),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "checkIn", null);
exports.AttendanceController = AttendanceController = AttendanceController_1 = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_scope_guard_1.TenantScopeGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map