export declare class SignedUrlService {
    private readonly logger;
    private readonly bucket;
    private readonly expiry;
    private readonly storage;
    getSignedUrl(storedUrl: string, expiresInSeconds?: number): Promise<string>;
}
