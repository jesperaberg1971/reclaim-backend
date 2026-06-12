"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
exports.storageConfig = {
    gcsBucketName: process.env.GCS_BUCKET_NAME,
    signedUrlExpiry: Number(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600'),
    doSpacesEndpoint: process.env.DO_SPACES_ENDPOINT,
    doSpacesBucket: process.env.DO_SPACES_BUCKET,
    doSpacesKey: process.env.DO_SPACES_KEY,
    doSpacesSecret: process.env.DO_SPACES_SECRET,
    doSpacesRegion: process.env.DO_SPACES_REGION ?? 'sgp1',
    uploadsDir: process.env.UPLOADS_DIR,
};
//# sourceMappingURL=storage.config.js.map