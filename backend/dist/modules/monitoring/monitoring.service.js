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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../common/redis/redis.service");
const queue_constants_1 = require("../queue/queue.constants");
const THRESHOLD = {
    ocrQueueWarn: Number(process.env.OCR_QUEUE_WARN_THRESHOLD ?? 20),
    hitlBacklogWarn: Number(process.env.HITL_BACKLOG_WARN_THRESHOLD ?? 15),
    ocrFailureRateWarn: Number(process.env.OCR_FAIL_RATE_WARN ?? 0.30),
    staleJobWarn: Number(process.env.STALE_JOB_WARN_THRESHOLD ?? 3),
};
let MonitoringService = MonitoringService_1 = class MonitoringService {
    constructor(dataSource, redisService, config, ocrQueue) {
        this.dataSource = dataSource;
        this.redisService = redisService;
        this.config = config;
        this.ocrQueue = ocrQueue;
        this.logger = new common_1.Logger(MonitoringService_1.name);
        this.startTime = Date.now();
    }
    async getHealth() {
        const [dbCheck, redisCheck, queueCheck] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkOcrQueue(),
        ]);
        const alerts = this.buildAlerts({ db: dbCheck, redis: redisCheck, queue: queueCheck });
        const overall = dbCheck.status === 'error' || redisCheck.status === 'error' ? 'unhealthy' :
            alerts.length > 0 ? 'degraded' :
                'healthy';
        if (overall !== 'healthy') {
            this.logger[overall === 'unhealthy' ? 'error' : 'warn'](`[Health] status=${overall} alerts=${JSON.stringify(alerts)}`);
        }
        return {
            status: overall,
            version: process.env.APP_VERSION ?? 'dev',
            uptime_s: Math.floor((Date.now() - this.startTime) / 1000),
            checks: {
                database: dbCheck,
                redis: redisCheck,
                ocr_queue: queueCheck,
            },
            alerts,
            timestamp: new Date().toISOString(),
        };
    }
    async getMetrics() {
        const [counts, stale, hitl, ocrMetrics, erpExports] = await Promise.all([
            this.ocrQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed'),
            this.countStaleProcessingJobs(),
            this.getHitlBacklog(),
            this.redisService.getOcrMetrics(),
            this.countErpExports7d(),
        ]);
        const alerts = this.buildMetricAlerts(counts, stale, hitl.count, ocrMetrics.failure_rate);
        for (const alert of alerts) {
            this.logger.warn(`[Alert] ${alert}`);
        }
        return {
            ocr_queue: {
                waiting: counts.waiting ?? 0,
                active: counts.active ?? 0,
                delayed: counts.delayed ?? 0,
                completed: counts.completed ?? 0,
                failed: counts.failed ?? 0,
                stale_processing: stale,
            },
            hitl_backlog: hitl.count,
            hitl_avg_age_hours: hitl.avg_age_hours,
            ocr_outcomes_month: ocrMetrics.outcomes,
            ocr_success_rate: ocrMetrics.success_rate,
            ocr_hitl_rate: ocrMetrics.hitl_rate,
            ocr_failure_rate: ocrMetrics.failure_rate,
            ocr_failure_reasons: ocrMetrics.failure_reasons,
            erp_exports_7d: erpExports,
            alerts,
            thresholds: THRESHOLD,
            timestamp: new Date().toISOString(),
        };
    }
    async checkDatabase() {
        const t = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
            return { status: 'ok', latency_ms: Date.now() - t };
        }
        catch (err) {
            return { status: 'error', detail: err.message };
        }
    }
    async checkRedis() {
        try {
            const latency_ms = await this.redisService.ping();
            return { status: 'ok', latency_ms };
        }
        catch (err) {
            return { status: 'error', detail: err.message };
        }
    }
    async checkOcrQueue() {
        try {
            const counts = await this.ocrQueue.getJobCounts('waiting', 'active', 'failed');
            const stale = await this.countStaleProcessingJobs();
            const status = counts.failed > 0 || stale >= THRESHOLD.staleJobWarn ? 'warn' :
                counts.waiting >= THRESHOLD.ocrQueueWarn ? 'warn' :
                    'ok';
            const detail = status === 'warn'
                ? `waiting=${counts.waiting} failed=${counts.failed} stale=${stale}`
                : undefined;
            return { status, counts: { waiting: counts.waiting, active: counts.active, failed: counts.failed }, stale, detail };
        }
        catch (err) {
            return { status: 'error', detail: err.message };
        }
    }
    async countStaleProcessingJobs() {
        try {
            const [{ count }] = await this.dataSource.query(`SELECT COUNT(*) AS count FROM expenses
         WHERE status = 'processing'
           AND created_at < NOW() - INTERVAL '10 minutes'`);
            return Number(count);
        }
        catch {
            return 0;
        }
    }
    async getHitlBacklog() {
        try {
            const [row] = await this.dataSource.query(`SELECT
           COUNT(*)                                               AS count,
           COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600), 0) AS avg_age_hours
         FROM expenses
         WHERE status = 'needs_review'`);
            return {
                count: Number(row.count),
                avg_age_hours: Math.round(Number(row.avg_age_hours) * 10) / 10,
            };
        }
        catch {
            return { count: 0, avg_age_hours: 0 };
        }
    }
    async countErpExports7d() {
        try {
            const [{ count }] = await this.dataSource.query(`SELECT COUNT(*) AS count FROM audit_logs
         WHERE action IN ('erp_export', 'misa_csv_export')
           AND created_at > NOW() - INTERVAL '7 days'`);
            return Number(count);
        }
        catch {
            return 0;
        }
    }
    buildAlerts(checks) {
        const alerts = [];
        if (checks.db.status === 'error')
            alerts.push('DATABASE_DOWN: cannot reach PostgreSQL');
        if (checks.redis.status === 'error')
            alerts.push('REDIS_DOWN: cannot reach Redis/BullMQ');
        if ((checks.queue.counts?.waiting ?? 0) >= THRESHOLD.ocrQueueWarn)
            alerts.push(`OCR_QUEUE_BACKLOG: ${checks.queue.counts?.waiting} jobs waiting (threshold ${THRESHOLD.ocrQueueWarn})`);
        if ((checks.queue.stale ?? 0) >= THRESHOLD.staleJobWarn)
            alerts.push(`STALE_JOBS: ${checks.queue.stale} expenses stuck in 'processing' > 10 min`);
        return alerts;
    }
    buildMetricAlerts(counts, stale, hitlBacklog, failureRate) {
        const alerts = [];
        if ((counts.waiting ?? 0) >= THRESHOLD.ocrQueueWarn)
            alerts.push(`OCR_QUEUE_BACKLOG: ${counts.waiting} jobs waiting (threshold ${THRESHOLD.ocrQueueWarn})`);
        if (stale >= THRESHOLD.staleJobWarn)
            alerts.push(`STALE_JOBS: ${stale} expenses stuck in 'processing' > 10 min`);
        if (hitlBacklog >= THRESHOLD.hitlBacklogWarn)
            alerts.push(`HITL_BACKLOG: ${hitlBacklog} expenses awaiting human review (threshold ${THRESHOLD.hitlBacklogWarn})`);
        if (failureRate >= THRESHOLD.ocrFailureRateWarn)
            alerts.push(`HIGH_OCR_FAILURE_RATE: ${(failureRate * 100).toFixed(1)}% this month (threshold ${(THRESHOLD.ocrFailureRateWarn * 100).toFixed(0)}%)`);
        return alerts;
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)(queue_constants_1.OCR_QUEUE)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        redis_service_1.RedisService,
        config_1.ConfigService,
        bullmq_2.Queue])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map