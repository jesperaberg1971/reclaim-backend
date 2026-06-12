import { DataSource } from 'typeorm';
import { AuditService } from '../../common/audit/audit.service';
import { ListTenantsQueryDto, UpdateTenantDto, CreateTenantDto, ListUsersQueryDto, UpdateUserDto, AuditLogQueryDto, AdminAnalyticsQueryDto, CreateAdminUserDto, BulkTenantActionDto, BulkUserActionDto, ProvisionTenantDto } from './dto/admin-query.dto';
export interface TenantSummary {
    id: string;
    name: string;
    tax_code: string;
    is_active: boolean;
    created_at: string;
    client_count: number;
    user_count: number;
    subscription_tier: string | null;
}
export interface TenantDetail extends TenantSummary {
    policies: Record<string, unknown>;
    monthly_price_vnd: string | null;
    next_billing_date: string | null;
}
export interface UserSummary {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    tenant_id: string | null;
    tenant_name: string | null;
}
export interface AuditLogEntry {
    id: string;
    tenant_id: string | null;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}
export interface AdminAnalytics {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    active_users: number;
    events_in_period: number;
    top_actions: {
        action: string;
        count: number;
    }[];
    new_tenants_in_period: number;
}
export interface TenantUsage {
    tenant_id: string;
    tenant_name: string;
    total_expenses: number;
    expenses_this_month: number;
    pending_expenses: number;
    approved_expenses: number;
    total_amount_vnd: string;
    total_users: number;
    active_users: number;
    subscription_status: string | null;
    subscription_tier: string | null;
    last_activity: string | null;
}
export interface ProvisionResult {
    partner: TenantDetail;
    admin_user: UserSummary;
}
export declare class AdminService {
    private readonly dataSource;
    private readonly auditService;
    constructor(dataSource: DataSource, auditService: AuditService);
    listTenants(query: ListTenantsQueryDto): Promise<{
        items: TenantSummary[];
        total: number;
    }>;
    getTenant(tenantId: string): Promise<TenantDetail>;
    createTenant(dto: CreateTenantDto, adminUserId: string): Promise<TenantDetail>;
    updateTenant(tenantId: string, dto: UpdateTenantDto, adminUserId: string): Promise<TenantDetail>;
    listUsers(query: ListUsersQueryDto): Promise<{
        items: UserSummary[];
        total: number;
    }>;
    updateUser(userId: string, dto: UpdateUserDto, adminUserId: string): Promise<UserSummary>;
    adminResetPassword(targetUserId: string, newPassword: string, adminUserId: string): Promise<void>;
    createAdminUser(dto: CreateAdminUserDto, adminUserId: string): Promise<UserSummary>;
    getAuditLogs(query: AuditLogQueryDto): Promise<{
        items: AuditLogEntry[];
        total: number;
    }>;
    bulkActionTenants(dto: BulkTenantActionDto, adminUserId: string): Promise<{
        affected: number;
    }>;
    bulkActionUsers(dto: BulkUserActionDto, adminUserId: string): Promise<{
        affected: number;
    }>;
    getTenantUsage(tenantId: string): Promise<TenantUsage>;
    provisionTenant(dto: ProvisionTenantDto, adminUserId: string): Promise<ProvisionResult>;
    getAnalytics(query: AdminAnalyticsQueryDto): Promise<AdminAnalytics>;
}
