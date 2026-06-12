"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRedisConfig = parseRedisConfig;
function parseRedisConfig(config) {
    const url = config.get('REDIS_URL');
    if (url) {
        const u = new URL(url);
        return {
            host: u.hostname,
            port: parseInt(u.port, 10),
            password: u.password ? decodeURIComponent(u.password) : undefined,
            tls: u.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
        };
    }
    return {
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get('REDIS_PORT', 6379),
        password: config.get('REDIS_PASSWORD') || undefined,
    };
}
//# sourceMappingURL=redis-config.js.map