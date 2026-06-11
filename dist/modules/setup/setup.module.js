"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const setup_controller_1 = require("./setup.controller");
const setup_service_1 = require("./setup.service");
const user_entity_1 = require("../../database/entities/user.entity");
const partner_entity_1 = require("../../database/entities/partner.entity");
const employee_entity_1 = require("../../database/entities/employee.entity");
const redis_module_1 = require("../../common/redis/redis.module");
let SetupModule = class SetupModule {
};
exports.SetupModule = SetupModule;
exports.SetupModule = SetupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, partner_entity_1.Partner, employee_entity_1.Employee]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '24h' },
                }),
            }),
            redis_module_1.RedisModule,
        ],
        controllers: [setup_controller_1.SetupController, setup_controller_1.MobileGuideController],
        providers: [setup_service_1.SetupService],
        exports: [setup_service_1.SetupService],
    })
], SetupModule);
//# sourceMappingURL=setup.module.js.map