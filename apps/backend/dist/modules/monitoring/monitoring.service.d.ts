import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
declare const THRESHOLD: {
    readonly ocrQueueWarn: number;
    readonly hitlBacklogWarn: number;
    readonly ocrFailureRateWarn: number;
    readonly staleJobWarn: number;
};
export type CheckStatus = 'ok' | 'warn' | 'error';
export type OverallStatus = 'healthy' | 'degraded' | 'unhealthy';
export interface CheckResult {
    status: CheckStatus;
    latency_ms?: number;
    detail?: string;
}
export interface QueueCounts {
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
}
export interface HealthReport {
    status: OverallStatus;
    version: string;
    uptime_s: number;
    checks: {
        database: CheckResult;
        redis: CheckResult;
        ocr_queue: CheckResult & {
            counts?: Partial<QueueCounts>;
            stale?: number;
        };
    };
    alerts: string[];
    timestamp: string;
}
export interface MetricsReport {
    ocr_queue: QueueCounts & {
        stale_processing: number;
    };
    hitl_backlog: number;
    hitl_avg_age_hours: number;
    ocr_outcomes_month: {
        complete: number;
        needs_review: number;
        failed: number;
    };
    ocr_success_rate: number;
    ocr_hitl_rate: number;
    ocr_failure_rate: number;
    ocr_failure_reasons: Record<string, number>;
    erp_exports_7d: number;
    alerts: string[];
    thresholds: typeof THRESHOLD;
    timestamp: string;
}
export declare class MonitoringService {
    private readonly dataSource;
    private readonly redisService;
    private readonly config;
    private readonly ocrQueue;
    private readonly logger;
    private readonly startTime;
    constructor(dataSource: DataSource, redisService: RedisService, config: ConfigService, ocrQueue: Queue);
    getHealth(): Promise<HealthReport>;
    getMetrics(): Promise<MetricsReport>;
    private checkDatabase;
    private checkRedis;
    private checkOcrQueue;
    private countStaleProcessingJobs;
    private getHitlBacklog;
    private countErpExports7d;
    private buildAlerts;
    private buildMetricAlerts;
}
export {};
