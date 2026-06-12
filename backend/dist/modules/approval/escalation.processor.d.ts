import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { ApprovalChainService } from './approval-chain.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class EscalationProcessor extends WorkerHost {
    private readonly dataSource;
    private readonly chainService;
    private readonly notificationsService;
    private readonly logger;
    constructor(dataSource: DataSource, chainService: ApprovalChainService, notificationsService: NotificationsService);
    process(_job: Job): Promise<void>;
    private processTenant;
}
