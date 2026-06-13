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
var SignedUrlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedUrlService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const storage_1 = require("@google-cloud/storage");
const spaces_service_1 = require("./spaces.service");
let SignedUrlService = SignedUrlService_1 = class SignedUrlService {
    constructor(spacesService) {
        this.spacesService = spacesService;
        this.logger = new common_1.Logger(SignedUrlService_1.name);
        this.provider = process.env.STORAGE_PROVIDER ?? 'local';
        this.gcsBucket = process.env.GCS_BUCKET_NAME ?? null;
        this.expiry = Number(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600');
        this.gcsStorage = this.gcsBucket ? new storage_1.Storage() : null;
        this.signingKey = process.env.FILE_SIGNING_KEY ?? process.env.JWT_SECRET ?? 'dev-file-key';
    }
    async getSignedUrl(storedUrl, expiresInSeconds) {
        const objectKey = storedUrl.replace(/^\/api\/files\//, '');
        const ttl = expiresInSeconds ?? this.expiry;
        if (this.provider === 'spaces') {
            try {
                return await this.spacesService.getSignedUrl(objectKey, ttl);
            }
            catch (err) {
                this.logger.warn(`Spaces signed URL failed for ${objectKey}: ${err.message}`);
            }
        }
        if (this.gcsBucket && this.gcsStorage) {
            try {
                const [url] = await this.gcsStorage
                    .bucket(this.gcsBucket)
                    .file(objectKey)
                    .getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + ttl * 1000 });
                return url;
            }
            catch (err) {
                this.logger.warn(`GCS signed URL failed for ${objectKey}: ${err.message}`);
            }
        }
        const exp = Math.floor(Date.now() / 1000) + ttl;
        const sig = (0, crypto_1.createHmac)('sha256', this.signingKey)
            .update(`${objectKey}:${exp}`)
            .digest('hex');
        const qs = new URLSearchParams({ path: objectKey, exp: String(exp), sig }).toString();
        return `/api/files/view?${qs}`;
    }
};
exports.SignedUrlService = SignedUrlService;
exports.SignedUrlService = SignedUrlService = SignedUrlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [spaces_service_1.SpacesService])
], SignedUrlService);
//# sourceMappingURL=signed-url.service.js.map