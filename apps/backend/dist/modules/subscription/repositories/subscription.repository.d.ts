import { BaseRepository } from '../../../database/repositories/base.repository';
import { Subscription } from '../../../database/entities/subscription.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class SubscriptionRepository extends BaseRepository<Subscription> {
    constructor(cls: ClsService, dataSource: DataSource);
}
