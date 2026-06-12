"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("../../database/entities/user.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../../common/audit/audit.service");
const redis_service_1 = require("../../common/redis/redis.service");
const REFRESH_TOKEN_TTL_S = 30 * 24 * 60 * 60;
const REFRESH_TOKEN_PREFIX = 'rt:';
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, jwtService, configService, auditService, dataSource, redisService) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
        this.dataSource = dataSource;
        this.redisService = redisService;
    }
    async register(dto) {
        const existing = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepo.create({
            email: dto.email,
            password_hash: passwordHash,
            role: dto.role,
            partner: dto.partnerId ? { id: dto.partnerId } : undefined,
            client: dto.clientId ? { id: dto.clientId } : undefined,
        });
        const savedUser = await this.userRepo.save(user);
        const fullUser = await this.userRepo.findOne({
            where: { id: savedUser.id },
            relations: ['partner', 'client'],
        });
        return this.issueTokenPair(fullUser);
    }
    async login(dto, ipAddress) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
            relations: ['partner', 'client'],
        });
        if (!user) {
            void this.auditService.log({ action: 'login_failed', ipAddress, metadata: { email: dto.email } });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            void this.auditService.log({ action: 'login_failed', ipAddress, metadata: { email: dto.email } });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const result = await this.issueTokenPair(user);
        const tenantId = user.role === 'partner_admin' ? user.partner?.id : user.client?.partnerId;
        void this.auditService.log({
            tenantId,
            userId: user.id,
            ipAddress,
            action: 'login',
            metadata: { role: user.role },
        });
        return result;
    }
    async refresh(refreshToken) {
        const key = REFRESH_TOKEN_PREFIX + refreshToken;
        const raw = await this.redisService.cacheGet(key);
        if (!raw)
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        let payload;
        try {
            payload = JSON.parse(raw);
        }
        catch {
            await this.redisService.cacheDelete(key);
            throw new common_1.UnauthorizedException('Malformed refresh token');
        }
        await this.redisService.cacheDelete(key);
        const user = await this.userRepo.findOne({
            where: { id: payload.userId },
            relations: ['partner', 'client'],
        });
        if (!user)
            throw new common_1.UnauthorizedException('User no longer exists');
        return this.issueTokenPair(user);
    }
    async logout(refreshToken) {
        await this.redisService.cacheDelete(REFRESH_TOKEN_PREFIX + refreshToken);
    }
    async issueTokenPair(user) {
        const { accessToken, payload } = await this.buildAccessToken(user);
        const refreshToken = crypto.randomBytes(40).toString('hex');
        await this.redisService.cacheSet(REFRESH_TOKEN_PREFIX + refreshToken, JSON.stringify({ ...payload, userId: user.id }), REFRESH_TOKEN_TTL_S);
        return { accessToken, refreshToken };
    }
    async buildAccessToken(user) {
        let tenantId = null;
        if (user.role === 'super_admin') {
            tenantId = null;
        }
        else if (user.role === 'partner_admin') {
            if (!user.partner?.id)
                throw new common_1.InternalServerErrorException('partner_admin has no partner');
            tenantId = user.partner.id;
        }
        else {
            if (!user.client?.partnerId)
                throw new common_1.InternalServerErrorException('User has no client/partner');
            tenantId = user.client.partnerId;
        }
        let employeeId;
        if (user.role === 'employee' && user.client?.id && tenantId) {
            const rows = await this.dataSource.transaction(async (manager) => {
                await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
                return manager.query(`SELECT id FROM employees WHERE client_id = $1 AND is_active = true LIMIT 1`, [user.client.id]);
            });
            employeeId = rows[0]?.id;
        }
        const payload = {
            sub: user.id,
            userId: user.id,
            tenantId,
            role: user.role,
            partnerId: user.partner?.id,
            clientId: user.client?.id,
            employeeId,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '2h',
        });
        return { accessToken, payload };
    }
    async forgotPassword(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            return { token: '' };
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + AuthService_1.RESET_TOKEN_TTL_S * 1000);
        await this.dataSource.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [user.id]);
        await this.dataSource.query(`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`, [token, user.id, expiresAt]);
        void this.auditService.log({ userId: user.id, action: 'login', metadata: { event: 'forgot_password' } });
        return { token };
    }
    async resetPassword(token, newPassword) {
        const rows = await this.dataSource.query(`SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1`, [token]);
        if (!rows.length || new Date(rows[0].expires_at) < new Date()) {
            if (rows.length) {
                await this.dataSource.query(`DELETE FROM password_reset_tokens WHERE token = $1`, [token]);
            }
            throw new common_1.BadRequestException('Invalid or expired password reset token');
        }
        const { user_id } = rows[0];
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.dataSource.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, user_id]);
        await this.dataSource.query(`DELETE FROM password_reset_tokens WHERE token = $1`, [token]);
        void this.auditService.log({ userId: user_id, action: 'login', metadata: { event: 'password_reset' } });
    }
};
exports.AuthService = AuthService;
AuthService.RESET_TOKEN_TTL_S = 3_600;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        typeorm_2.DataSource,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map