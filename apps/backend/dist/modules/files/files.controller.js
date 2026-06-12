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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const crypto_1 = require("crypto");
const storage_1 = require("@google-cloud/storage");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const spaces_service_1 = require("../../common/storage/spaces.service");
const EXT_TO_MIME = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    pdf: 'application/pdf', tiff: 'image/tiff', bmp: 'image/bmp', webp: 'image/webp',
};
const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const SAFE_FILENAME = /^[a-zA-Z0-9_.][a-zA-Z0-9_.-]*$/;
let FilesController = class FilesController {
    constructor(dataSource, spacesService) {
        this.dataSource = dataSource;
        this.spacesService = spacesService;
        this.uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads');
        this.signingKey = process.env.FILE_SIGNING_KEY ?? process.env.JWT_SECRET ?? 'dev-file-key';
    }
    async serveSignedFile(pathParam, expParam, sigParam, res) {
        if (!pathParam || !expParam || !sigParam)
            throw new common_1.ForbiddenException();
        const exp = Number(expParam);
        if (!Number.isInteger(exp) || Math.floor(Date.now() / 1000) > exp) {
            throw new common_1.ForbiddenException('Signed URL has expired');
        }
        const expected = (0, crypto_1.createHmac)('sha256', this.signingKey)
            .update(`${pathParam}:${exp}`)
            .digest('hex');
        try {
            if (!(0, crypto_1.timingSafeEqual)(Buffer.from(sigParam, 'hex'), Buffer.from(expected, 'hex'))) {
                throw new common_1.ForbiddenException();
            }
        }
        catch {
            throw new common_1.ForbiddenException();
        }
        const parts = pathParam.split('/');
        if (parts.length !== 2 ||
            !SAFE_SEGMENT.test(parts[0]) ||
            !SAFE_FILENAME.test(parts[1])) {
            throw new common_1.ForbiddenException();
        }
        await this.sendFile(parts[0], parts[1], res);
    }
    async serveFile(subfolder, filename, req, res) {
        if (!SAFE_SEGMENT.test(subfolder) || !SAFE_FILENAME.test(filename)) {
            throw new common_1.ForbiddenException();
        }
        const relPath = `${subfolder}/${filename}`;
        const tenantId = req.user.tenantId;
        let owned = false;
        if (subfolder === 'invoices') {
            const rows = await this.dataSource.query(`SELECT 1 FROM invoices WHERE partner_id = $1 AND pdf_path LIKE $2 LIMIT 1`, [tenantId, `%/${relPath}`]);
            owned = rows.length > 0 || req.user?.role === 'super_admin';
        }
        else {
            const rows = await this.dataSource.query(`SELECT 1
         FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE c.partner_id = $1
           AND (
             EXISTS (
               SELECT 1 FROM jsonb_array_elements(e.supporting_documents) doc
               WHERE doc->>'url' LIKE $2
             )
             OR e.receipt_image_url LIKE $2
           )
         LIMIT 1`, [tenantId, `%/${relPath}`]);
            owned = rows.length > 0;
        }
        if (!owned)
            throw new common_1.NotFoundException();
        await this.sendFile(subfolder, filename, res);
    }
    async sendFile(subfolder, filename, res) {
        const relPath = `${subfolder}/${filename}`;
        const ext = path.extname(filename).slice(1).toLowerCase();
        const mimeType = EXT_TO_MIME[ext] ?? 'application/octet-stream';
        const bucketName = process.env.GCS_BUCKET_NAME;
        if (process.env.STORAGE_PROVIDER === 'spaces') {
            let buffer;
            try {
                buffer = await this.spacesService.getObject(relPath);
            }
            catch {
                throw new common_1.NotFoundException();
            }
            res.type(mimeType).send(buffer);
            return;
        }
        if (bucketName) {
            let buffer;
            try {
                [buffer] = await new storage_1.Storage().bucket(bucketName).file(relPath).download();
            }
            catch {
                throw new common_1.NotFoundException();
            }
            res.type(mimeType).send(buffer);
            return;
        }
        const filePath = path.join(this.uploadsDir, relPath);
        if (!filePath.startsWith(this.uploadsDir + path.sep))
            throw new common_1.ForbiddenException();
        if (!fs.existsSync(filePath))
            throw new common_1.NotFoundException();
        res.sendFile(filePath);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Get)('view'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Query)('path')),
    __param(1, (0, common_1.Query)('exp')),
    __param(2, (0, common_1.Query)('sig')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "serveSignedFile", null);
__decorate([
    (0, common_1.Get)(':subfolder/:filename'),
    __param(0, (0, common_1.Param)('subfolder')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "serveFile", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.SkipThrottle)(),
    __param(0, (0, typeorm_2.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        spaces_service_1.SpacesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map