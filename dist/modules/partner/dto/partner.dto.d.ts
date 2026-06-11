export declare class CreateClientDto {
    name: string;
}
export declare class UpdateClientDto {
    name?: string;
    is_active?: boolean;
}
export declare class CreateEmployeeDto {
    full_name: string;
    employee_id: string;
    client_id: string;
}
export declare class UpdateEmployeeDto {
    full_name?: string;
    is_active?: boolean;
    pdpd_consent?: boolean;
}
export declare class PartnerReportQueryDto {
    from?: string;
    to?: string;
    client_id?: string;
}
