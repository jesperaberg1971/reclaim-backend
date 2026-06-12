import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare class RlsInterceptor implements NestInterceptor {
    private readonly dataSource;
    private readonly cls;
    constructor(dataSource: DataSource, cls: ClsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
