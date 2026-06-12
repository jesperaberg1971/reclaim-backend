import { ConfigService } from '@nestjs/config';
import { OcrDiagnostics } from './ocr-failure.types';
export interface OcrResult {
    vendor: string | null;
    amount: number;
    currency: string;
    date: string;
    rawText: string;
    entities: Record<string, any>[];
    confidence: number;
    diagnostics: OcrDiagnostics;
}
export declare class OcrService {
    private readonly config;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService);
    extractFromImage(imageBuffer: Buffer, mimeType?: string, attempt?: number): Promise<OcrResult>;
    private parseDocument;
}
export declare class OcrRetryableError extends Error {
    readonly isRetryable = true;
    constructor(message: string);
}
export declare class OcrNonRetryableError extends Error {
    readonly isRetryable = false;
    constructor(message: string);
}
export declare class OcrConfigurationError extends OcrNonRetryableError {
    constructor(message: string);
}
export declare function isRetryableOcrError(err: Error): boolean;
