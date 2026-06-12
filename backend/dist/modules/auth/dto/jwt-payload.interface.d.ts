export interface JwtPayload {
    sub: string;
    userId: string;
    tenantId: string | null;
    role: 'partner_admin' | 'client_admin' | 'employee' | 'super_admin';
    partnerId?: string;
    clientId?: string;
    employeeId?: string;
    iat?: number;
    exp?: number;
}
