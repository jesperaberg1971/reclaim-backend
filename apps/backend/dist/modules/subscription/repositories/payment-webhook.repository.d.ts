import { BaseRepository } from '../../../database/repositories/base.repository';
import { PaymentWebhook } from '../../../database/entities/payment-webhook.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
export declare class PaymentWebhookRepository extends BaseRepository<PaymentWebhook> {
    constructor(cls: ClsService, dataSource: DataSource);
}
