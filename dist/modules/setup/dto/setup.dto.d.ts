export declare class CreatePartnerDto {
    firm_name: string;
    tax_code: string;
    admin_email: string;
    admin_password: string;
}
export declare class CreateClientDto {
    name: string;
}
export declare class CreateClientAdminDto {
    client_id: string;
    email: string;
    password: string;
}
export declare class BulkEmployeeItemDto {
    full_name: string;
    employee_code?: string;
    email: string;
    password: string;
}
export declare class BulkImportDto {
    client_id: string;
    employees: BulkEmployeeItemDto[];
}
export declare class CreateEmployeeDto {
    client_id: string;
    full_name: string;
    employee_code?: string;
    email: string;
    password: string;
}
