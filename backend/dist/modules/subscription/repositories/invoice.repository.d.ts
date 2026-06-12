import { BaseRepository } from '../../../database/repositories/base.repository';
import { Invoice } from '../../../database/entities/invoice.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class InvoiceRepository extends BaseRepository<Invoice> {
    constructor(cls: ClsService, dataSource: DataSource);
}
