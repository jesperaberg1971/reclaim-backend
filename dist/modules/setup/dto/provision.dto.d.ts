export declare class ProvisionEmployeeDto {
    full_name: string;
    employee_code: string;
    email: string;
    password: string;
}
export declare class ProvisionClientDto {
    name: string;
    admin_email?: string;
    admin_password?: string;
    employees?: ProvisionEmployeeDto[];
}
export declare class ProvisionDto {
    firm_name: string;
    tax_code: string;
    admin_email: string;
    admin_password: string;
    clients?: ProvisionClientDto[];
}
export interface ProvisionedClient {
    id: string;
    name: string;
    admin_user_id: string | null;
    employees: {
        employee_id: string;
        user_id: string;
        full_name: string;
    }[];
}
export interface ProvisionResult {
    partner_id: string;
    partner_name: string;
    access_token: string;
    clients: ProvisionedClient[];
}
