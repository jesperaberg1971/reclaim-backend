import { SpacesService } from './spaces.service';
export declare class SignedUrlService {
    private readonly spacesService;
    private readonly logger;
    private readonly provider;
    private readonly gcsBucket;
    private readonly expiry;
    private readonly gcsStorage;
    private readonly signingKey;
    constructor(spacesService: SpacesService);
    getSignedUrl(storedUrl: string, expiresInSeconds?: number): Promise<string>;
}
