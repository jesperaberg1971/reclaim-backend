import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    decrementDailyAllowance(employeeId: string, tripDecisionId: string, amount: Decimal): Promise<void>;
    getRemainingAllowance(employeeId: string, tripDecisionId: string): Promise<Decimal>;
}
