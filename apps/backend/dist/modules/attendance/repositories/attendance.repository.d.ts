import { BaseRepository } from '../../../database/repositories/base.repository';
import { AttendanceCheckin } from '../../../database/entities/attendance-checkin.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class AttendanceRepository extends BaseRepository<AttendanceCheckin> {
    constructor(cls: ClsService, dataSource: DataSource);
}
