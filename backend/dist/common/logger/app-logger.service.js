"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const common_1 = require("@nestjs/common");
class AppLogger extends common_1.ConsoleLogger {
    constructor(context) {
        super(context ?? '');
        this.json = process.env.NODE_ENV === 'production';
    }
    emit(level, message, context) {
        if (!this.json)
            return;
        process.stdout.write(JSON.stringify({
            level,
            timestamp: new Date().toISOString(),
            context: context ?? this.context ?? '',
            message: typeof message === 'string' ? message : JSON.stringify(message),
            pid: process.pid,
        }) + '\n');
    }
    log(message, context) { if (this.json) {
        this.emit('log', message, context);
    }
    else {
        super.log(message, context);
    } }
    warn(message, context) { if (this.json) {
        this.emit('warn', message, context);
    }
    else {
        super.warn(message, context);
    } }
    error(message, context) { if (this.json) {
        this.emit('error', message, context);
    }
    else {
        super.error(message, context);
    } }
    debug(message, context) { if (this.json) {
        this.emit('debug', message, context);
    }
    else {
        super.debug(message, context);
    } }
    verbose(message, context) { if (this.json) {
        this.emit('verbose', message, context);
    }
    else {
        super.verbose(message, context);
    } }
    fatal(message, context) { if (this.json) {
        this.emit('fatal', message, context);
    }
    else {
        super.fatal(message, context);
    } }
}
exports.AppLogger = AppLogger;
//# sourceMappingURL=app-logger.service.js.map