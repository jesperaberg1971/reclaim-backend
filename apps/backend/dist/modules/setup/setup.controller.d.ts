import { SetupService } from './setup.service';
import { CreatePartnerDto, CreateClientDto, CreateEmployeeDto, CreateClientAdminDto, BulkImportDto } from './dto/setup.dto';
import { ProvisionDto } from './dto/provision.dto';
import { CreateInviteDto, RedeemInviteDto } from './dto/invite.dto';
import type { Response } from 'express';
export declare class SetupController {
    private readonly setupService;
    constructor(setupService: SetupService);
    getWizard(): string;
    createPartner(dto: CreatePartnerDto): Promise<{
        accessToken: string;
        partner_id: string;
    }>;
    provision(dto: ProvisionDto): Promise<import("./dto/provision.dto").ProvisionResult>;
    redeemInvite(dto: RedeemInviteDto): Promise<import("./dto/invite.dto").RedeemInviteResponse>;
    createClient(dto: CreateClientDto, req: any): Promise<{
        id: string;
        name: string;
    }>;
    createClientAdmin(dto: CreateClientAdminDto, req: any): Promise<{
        user_id: string;
        email: string;
        client_id: string;
    }>;
    createEmployee(dto: CreateEmployeeDto, req: any): Promise<{
        employee_id: string;
        user_id: string;
        full_name: string;
    }>;
    bulkImportEmployees(dto: BulkImportDto, req: any): Promise<import("./setup.service").BulkImportResult>;
    createInvite(dto: CreateInviteDto, req: any): Promise<import("./dto/invite.dto").InviteTokenResponse>;
    getChecklist(req: any): Promise<import("./setup.service").SetupChecklist>;
}
export declare class MobileGuideController {
    getGuide(res: Response): void;
}
