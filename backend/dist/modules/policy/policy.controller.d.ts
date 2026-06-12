import { Response } from 'express';
import { PolicyService } from './policy.service';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { SetClientPolicyDto } from './dto/set-client-policy.dto';
export declare class PolicyController {
    private readonly service;
    constructor(service: PolicyService);
    dashboard(res: Response): void;
    getPolicy(req: any): Promise<import("./policy.service").PolicyResponse>;
    updatePolicy(req: any, dto: UpdatePolicyDto): Promise<import("./policy.service").PolicyResponse>;
    getHistory(req: any): Promise<import("./policy.service").PolicyChangeRecord[]>;
    exportPolicy(req: any): Promise<{
        schema_version: string;
        exported_at: string;
        partner_name: string;
        effective_since: string;
        policy: import("../../database/entities").PartnerPolicies;
        labels: {
            meal_cap_vnd: string;
            per_diem_daily_vnd: string;
            welfare_monthly_cap_vnd: string;
            personal_card_limit_vnd: string;
            allowed_categories: string;
            require_original_receipt: string;
        };
        gate_mapping: {
            meal_cap_vnd: string[];
            per_diem_daily_vnd: string[];
            welfare_monthly_cap_vnd: string[];
            personal_card_limit_vnd: string[];
            allowed_categories: string[];
            require_original_receipt: string[];
        };
    }>;
    printPolicy(req: any, res: Response): Promise<void>;
    getVersions(req: any): Promise<import("./policy.service").PolicyVersionRecord[]>;
    getVersion(req: any, n: number): Promise<import("./policy.service").PolicyVersionRecord>;
    restoreVersion(req: any, n: number): Promise<import("./policy.service").PolicyResponse>;
    listClientPolicies(req: any): Promise<import("./policy.service").ClientPolicyResponse[]>;
    getClientPolicy(req: any, clientId: string): Promise<import("./policy.service").ClientPolicyResponse>;
    setClientPolicy(req: any, clientId: string, dto: SetClientPolicyDto): Promise<import("./policy.service").ClientPolicyResponse>;
    deleteClientPolicy(req: any, clientId: string): Promise<{
        ok: boolean;
    }>;
}
