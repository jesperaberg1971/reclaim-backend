import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../../common/audit/audit.service';
import { RedisService } from '../../common/redis/redis.service';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly configService;
    private readonly auditService;
    private readonly dataSource;
    private readonly redisService;
    private static readonly RESET_TOKEN_TTL_S;
    constructor(userRepo: Repository<User>, jwtService: JwtService, configService: ConfigService, auditService: AuditService, dataSource: DataSource, redisService: RedisService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    private issueTokenPair;
    private buildAccessToken;
    forgotPassword(email: string): Promise<{
        token: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<void>;
}
