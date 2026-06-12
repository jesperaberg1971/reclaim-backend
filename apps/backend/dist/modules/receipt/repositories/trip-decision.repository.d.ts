import { BaseRepository } from '../../../database/repositories/base.repository';
import { TripDecision } from '../../../database/entities/trip-decision.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class TripDecisionRepository extends BaseRepository<TripDecision> {
    constructor(cls: ClsService, dataSource: DataSource);
    findActiveTrip(employeeId: string, receiptDate: Date): Promise<TripDecision | null>;
}
