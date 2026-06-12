import { AdminService } from './admin.service';
import { ListTenantsQueryDto, UpdateTenantDto, CreateTenantDto, ListUsersQueryDto, UpdateUserDto, AdminResetPasswordDto, AuditLogQueryDto, AdminAnalyticsQueryDto, CreateAdminUserDto, BulkTenantActionDto, BulkUserActionDto, ProvisionTenantDto } from './dto/admin-query.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): string;
    listTenants(query: ListTenantsQueryDto): Promise<{
        items: import("./admin.service").TenantSummary[];
        total: number;
    }>;
    createTenant(dto: CreateTenantDto, req: any): Promise<import("./admin.service").TenantDetail>;
    getTenant(id: string): Promise<import("./admin.service").TenantDetail>;
    updateTenant(id: string, dto: UpdateTenantDto, req: any): Promise<import("./admin.service").TenantDetail>;
    getTenantUsage(id: string): Promise<import("./admin.service").TenantUsage>;
    bulkActionTenants(dto: BulkTenantActionDto, req: any): Promise<{
        affected: number;
    }>;
    provisionTenant(dto: ProvisionTenantDto, req: any): Promise<import("./admin.service").ProvisionResult>;
    listUsers(query: ListUsersQueryDto): Promise<{
        items: import("./admin.service").UserSummary[];
        total: number;
    }>;
    createAdminUser(dto: CreateAdminUserDto, req: any): Promise<import("./admin.service").UserSummary>;
    updateUser(id: string, dto: UpdateUserDto, req: any): Promise<import("./admin.service").UserSummary>;
    adminResetPassword(id: string, dto: AdminResetPasswordDto, req: any): Promise<void>;
    bulkActionUsers(dto: BulkUserActionDto, req: any): Promise<{
        affected: number;
    }>;
    getAuditLogs(query: AuditLogQueryDto): Promise<{
        items: import("./admin.service").AuditLogEntry[];
        total: number;
    }>;
    getAnalytics(query: AdminAnalyticsQueryDto): Promise<import("./admin.service").AdminAnalytics>;
}
