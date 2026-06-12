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
var SpacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpacesService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let SpacesService = SpacesService_1 = class SpacesService {
    constructor() {
        this.logger = new common_1.Logger(SpacesService_1.name);
        const endpoint = process.env.DO_SPACES_ENDPOINT;
        const region = process.env.DO_SPACES_REGION ?? 'sgp1';
        const bucket = process.env.DO_SPACES_BUCKET ?? '';
        const accessKey = process.env.DO_SPACES_ACCESS_KEY ?? '';
        const secretKey = process.env.DO_SPACES_SECRET_KEY ?? '';
        this.bucket = bucket;
        this.expiry = Number(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600');
        this.client = new client_s3_1.S3Client({
            endpoint,
            region,
            credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
            forcePathStyle: false,
        });
    }
    async onModuleInit() {
        if (process.env.STORAGE_PROVIDER !== 'spaces')
            return;
        try {
            await this.client.send(new client_s3_1.HeadBucketCommand({ Bucket: this.bucket }));
            this.logger.log(`Spaces connection verified — bucket: ${this.bucket}`);
        }
        catch (err) {
            this.logger.error(`Spaces bucket "${this.bucket}" is unreachable: ${err.message}. ` +
                'Check DO_SPACES_* env vars.');
        }
    }
    async uploadFile(key, buffer, mimeType) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ACL: 'private',
            CacheControl: 'private, max-age=3600',
        }));
        this.logger.debug(`Uploaded ${key} (${buffer.length} bytes) to Spaces`);
        return `/api/files/${key}`;
    }
    async getSignedUrl(key, expiresInSeconds) {
        const ttl = expiresInSeconds ?? this.expiry;
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: ttl });
    }
    async deleteFile(key) {
        try {
            await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
            this.logger.debug(`Deleted ${key} from Spaces`);
        }
        catch (err) {
            if (err.name !== 'NoSuchKey')
                throw err;
        }
    }
};
exports.SpacesService = SpacesService;
exports.SpacesService = SpacesService = SpacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SpacesService);
//# sourceMappingURL=spaces.service.js.map