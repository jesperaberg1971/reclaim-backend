export declare class ListTenantsQueryDto {
    activeOnly?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}
export declare class UpdateTenantDto {
    name?: string;
    is_active?: boolean;
    policies?: Record<string, unknown>;
}
export declare class CreateTenantDto {
    name: string;
    tax_code: string;
    policies?: Record<string, unknown>;
}
export declare class ListUsersQueryDto {
    tenantId?: string;
    role?: string;
    search?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
}
export declare class UpdateUserDto {
    is_active?: boolean;
    role?: 'partner_admin' | 'client_admin' | 'employee';
}
export declare class AdminResetPasswordDto {
    newPassword: string;
}
export declare class AuditLogQueryDto {
    tenantId?: string;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}
export declare class AdminAnalyticsQueryDto {
    from?: string;
    to?: string;
}
export declare class CreateAdminUserDto {
    email: string;
    password: string;
}
export declare class BulkTenantActionDto {
    action: 'activate' | 'deactivate';
    ids: string[];
}
export declare class BulkUserActionDto {
    action: 'activate' | 'deactivate';
    ids: string[];
}
export declare class ProvisionTenantDto {
    name: string;
    tax_code: string;
    admin_email: string;
    admin_password: string;
    policies?: Record<string, unknown>;
}
