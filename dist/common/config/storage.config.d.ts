export declare const storageConfig: {
    readonly provider: "local" | "spaces";
    readonly doSpacesEndpoint: string;
    readonly doSpacesRegion: string;
    readonly doSpacesBucket: string;
    readonly doSpacesAccessKey: string;
    readonly doSpacesSecretKey: string;
    readonly signedUrlExpiry: number;
    readonly fileSigningKey: string;
    readonly uploadsDir: string;
    readonly gcsBucketName: string;
};
