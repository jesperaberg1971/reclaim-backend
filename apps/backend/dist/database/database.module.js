"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_2 = require("typeorm");
const entities = require("./entities");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: true },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('POSTGRES_HOST', 'localhost'),
                    port: config.get('POSTGRES_PORT', 5432),
                    username: config.get('POSTGRES_USER', 'reclaim_app'),
                    password: config.get('POSTGRES_PASSWORD'),
                    database: config.get('POSTGRES_DB', 'reclaim'),
                    entities: Object.values(entities).filter(v => typeof v === 'function'),
                    synchronize: false,
                    migrations: ['dist/database/migrations/*.js'],
                    migrationsRun: false,
                    ssl: config.get('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
                    extra: { max: 30 },
                    logging: config.get('NODE_ENV') === 'development',
                }),
                dataSourceFactory: async (options) => {
                    if (!options)
                        throw new Error('TypeORM options missing');
                    return new typeorm_2.DataSource(options).initialize();
                },
            }),
            typeorm_1.TypeOrmModule.forFeature(Object.values(entities).filter(v => typeof v === 'function')),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map