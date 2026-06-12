"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
exports.storageConfig = {
    provider: (process.env.STORAGE_PROVIDER ?? 'local'),
    doSpacesEndpoint: process.env.DO_SPACES_ENDPOINT,
    doSpacesRegion: process.env.DO_SPACES_REGION ?? 'sgp1',
    doSpacesBucket: process.env.DO_SPACES_BUCKET ?? '',
    doSpacesAccessKey: process.env.DO_SPACES_ACCESS_KEY ?? '',
    doSpacesSecretKey: process.env.DO_SPACES_SECRET_KEY ?? '',
    signedUrlExpiry: Number(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600'),
    fileSigningKey: process.env.FILE_SIGNING_KEY ?? process.env.JWT_SECRET ?? 'dev-file-key',
    uploadsDir: process.env.UPLOADS_DIR,
    gcsBucketName: process.env.GCS_BUCKET_NAME,
};
//# sourceMappingURL=storage.config.js.map