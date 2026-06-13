import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    ping(): Promise<number>;
    cacheGet(key: string): Promise<string | null>;
    cacheSet(key: string, value: string, ttlSeconds: number): Promise<void>;
    cacheDelete(key: string): Promise<void>;
    decrementDailyAllowance(employeeId: string, tripDecisionId: string, amount: Decimal): Promise<void>;
    getRemainingAllowance(employeeId: string, tripDecisionId: string): Promise<Decimal>;
    setTempImage(key: string, base64: string): Promise<void>;
    getTempImage(key: string): Promise<string | null>;
    deleteTempImage(key: string): Promise<void>;
    private ocrPeriod;
    recordOcrOutcome(outcome: 'complete' | 'needs_review' | 'failed'): Promise<void>;
    recordOcrFailureReasons(reasons: string[]): Promise<void>;
    getOcrMetrics(period?: string): Promise<OcrMetrics>;
}
export interface OcrMetrics {
    period: string;
    outcomes: {
        complete: number;
        needs_review: number;
        failed: number;
    };
    failure_reasons: Record<string, number>;
    total: number;
    success_rate: number;
    hitl_rate: number;
    failure_rate: number;
}
