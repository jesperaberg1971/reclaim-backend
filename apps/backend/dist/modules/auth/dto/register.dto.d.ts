export declare class RegisterDto {
    email: string;
    password: string;
    role: 'partner_admin' | 'client_admin' | 'employee';
    partnerId?: string;
    clientId?: string;
    employeeId?: string;
}
