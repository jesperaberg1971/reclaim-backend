import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
export declare class SubscriptionGuard implements CanActivate {
    private readonly dataSource;
    private readonly reflector;
    constructor(dataSource: DataSource, reflector: Reflector);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
