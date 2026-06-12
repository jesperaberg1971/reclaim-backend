import { BaseRepository } from '../../../database/repositories/base.repository';
import { Partner } from '../../../database/entities/partner.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class PartnerRepository extends BaseRepository<Partner> {
    constructor(cls: ClsService, dataSource: DataSource);
    findByClientId(clientId: string): Promise<Partner | null>;
}
