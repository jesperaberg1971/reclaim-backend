"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const app_logger_service_1 = require("./common/logger/app-logger.service");
const helmet_1 = require("helmet");
const path = require("path");
const fs = require("fs");
const REQUIRED_PROD_VARS = [
    'POSTGRES_PASSWORD',
    'JWT_SECRET',
    'PAYMENT_WEBHOOK_SECRET',
    'ALLOWED_ORIGINS',
];
function validateEnvironment() {
    if (process.env.NODE_ENV !== 'production')
        return;
    const missing = REQUIRED_PROD_VARS.filter(k => !process.env[k]);
    if (missing.length) {
        console.error(`[Startup] FATAL: Missing required env vars in production: ${missing.join(', ')}`);
        process.exit(1);
    }
}
async function bootstrap() {
    validateEnvironment();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: new app_logger_service_1.AppLogger(),
    });
    app.useLogger(new app_logger_service_1.AppLogger());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:'],
            },
        },
    }));
    const uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads');
    fs.mkdirSync(path.join(uploadsDir, 'receipts'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'trip-decisions'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'invoices'), { recursive: true });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new http_exception_filter_1.GlobalExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const isProd = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProd
        ? (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://localhost:19006',
        ];
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`🚀 Reclaim Backend is running on http://localhost:${port}`);
    logger.log(`🛡️  Helmet and CORS active | Files served via authenticated /api/files`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map