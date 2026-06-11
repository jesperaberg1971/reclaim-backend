import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../common/redis/redis.service';
import { CreateClientAdminDto, CreateClientDto, CreateEmployeeDto, CreatePartnerDto, BulkImportDto } from './dto/setup.dto';
import { ProvisionDto, ProvisionResult } from './dto/provision.dto';
import { CreateInviteDto, InviteTokenResponse, RedeemInviteDto, RedeemInviteResponse } from './dto/invite.dto';
export interface SetupChecklist {
    partner: {
        id: string;
        name: string;
        tax_code: string;
        created_at: string;
    } | null;
    client_count: number;
    employee_count: number;
    receipt_count: number;
    steps_complete: number;
    next_step: 'add_client' | 'add_employee' | 'upload_receipt' | 'done';
    clients: {
        id: string;
        name: string;
        employee_count: number;
    }[];
}
export interface BulkImportResult {
    succeeded: {
        employee_id: string;
        user_id: string;
        full_name: string;
    }[];
    failed: {
        full_name: string;
        email: string;
        error: string;
    }[];
    total: number;
}
export declare class SetupService {
    private readonly dataSource;
    private readonly jwtService;
    private readonly config;
    private readonly redisService;
    private readonly logger;
    constructor(dataSource: DataSource, jwtService: JwtService, config: ConfigService, redisService: RedisService);
    createPartner(dto: CreatePartnerDto): Promise<{
        accessToken: string;
        partner_id: string;
    }>;
    createClient(tenantId: string, dto: CreateClientDto): Promise<{
        id: string;
        name: string;
    }>;
    createClientAdmin(tenantId: string, dto: CreateClientAdminDto): Promise<{
        user_id: string;
        email: string;
        client_id: string;
    }>;
    createEmployee(tenantId: string, dto: CreateEmployeeDto): Promise<{
        employee_id: string;
        user_id: string;
        full_name: string;
    }>;
    bulkImportEmployees(tenantId: string, dto: BulkImportDto): Promise<BulkImportResult>;
    provision(dto: ProvisionDto): Promise<ProvisionResult>;
    createInvite(tenantId: string, dto: CreateInviteDto): Promise<InviteTokenResponse>;
    redeemInvite(dto: RedeemInviteDto): Promise<RedeemInviteResponse>;
    getChecklist(tenantId: string): Promise<SetupChecklist>;
}
