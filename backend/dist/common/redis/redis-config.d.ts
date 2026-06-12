import { ConfigService } from '@nestjs/config';
export interface RedisConnectionOptions {
    host: string;
    port: number;
    password?: string;
    tls?: {
        rejectUnauthorized: boolean;
    };
}
export declare function parseRedisConfig(config: ConfigService): RedisConnectionOptions;
