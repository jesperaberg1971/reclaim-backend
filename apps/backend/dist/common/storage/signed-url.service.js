"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SignedUrlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedUrlService = void 0;
const common_1 = require("@nestjs/common");
const storage_1 = require("@google-cloud/storage");
let SignedUrlService = SignedUrlService_1 = class SignedUrlService {
    constructor() {
        this.logger = new common_1.Logger(SignedUrlService_1.name);
        this.bucket = process.env.GCS_BUCKET_NAME ?? null;
        this.expiry = Number(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600');
        this.storage = this.bucket ? new storage_1.Storage() : null;
    }
    async getSignedUrl(storedUrl, expiresInSeconds) {
        if (!this.bucket || !this.storage) {
            return storedUrl;
        }
        const key = storedUrl.replace(/^\/api\/files\//, '');
        const ttl = expiresInSeconds ?? this.expiry;
        try {
            const [url] = await this.storage
                .bucket(this.bucket)
                .file(key)
                .getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + ttl * 1000,
            });
            return url;
        }
        catch (err) {
            this.logger.warn(`Signed URL generation failed for ${key}: ${err.message}`);
            return storedUrl;
        }
    }
};
exports.SignedUrlService = SignedUrlService;
exports.SignedUrlService = SignedUrlService = SignedUrlService_1 = __decorate([
    (0, common_1.Injectable)()
], SignedUrlService);
//# sourceMappingURL=signed-url.service.js.map