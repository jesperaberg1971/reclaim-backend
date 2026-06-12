import { Response } from 'express';
import { MonitoringService } from './monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    live(res: Response): void;
    health(res: Response): Promise<void>;
    metrics(): Promise<import("./monitoring.service").MetricsReport>;
}
