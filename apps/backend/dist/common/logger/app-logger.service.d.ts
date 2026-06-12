import { ConsoleLogger } from '@nestjs/common';
export declare class AppLogger extends ConsoleLogger {
    private readonly json;
    constructor(context?: string);
    private emit;
    log(message: unknown, context?: string): void;
    warn(message: unknown, context?: string): void;
    error(message: unknown, context?: string): void;
    debug(message: unknown, context?: string): void;
    verbose(message: unknown, context?: string): void;
    fatal(message: unknown, context?: string): void;
}
