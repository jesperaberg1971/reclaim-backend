import { OnModuleInit } from '@nestjs/common';
export declare class SpacesService implements OnModuleInit {
    private readonly logger;
    private readonly client;
    private readonly bucket;
    private readonly expiry;
    constructor();
    onModuleInit(): Promise<void>;
    uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
    getObject(key: string): Promise<Buffer>;
    deleteFile(key: string): Promise<void>;
}
