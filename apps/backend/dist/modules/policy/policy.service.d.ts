import { DataSource } from 'typeorm';
import { PartnerPolicies } from '../../database/entities/partner.entity';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { SetClientPolicyDto } from './dto/set-client-policy.dto';
import { RedisService } from '../../common/redis/redis.service';
import { ApprovalChainService } from '../approval/approval-chain.service';
import { AuditService } from '../../common/audit/audit.service';
export declare const DEFAULT_POLICY: PartnerPolicies;
export interface PolicyResponse {
    partner_name: string;
    policy: PartnerPolicies;
    effective_since: string | null;
    changed?: boolean;
}
export interface PolicyChangeRecord {
    changed_at: string;
    user_id: string | null;
    previous: Partial<PartnerPolicies>;
    changes: Partial<PartnerPolicies>;
}
export interface PolicyVersionRecord {
    version_number: number;
    snapshot: PartnerPolicies;
    changed_by: string | null;
    created_at: string;
}
export interface ClientPolicyResponse {
    client_id: string;
    effective_policy: PartnerPolicies;
    overrides: Partial<PartnerPolicies>;
    notes: string | null;
    has_override: boolean;
}
export declare class PolicyService {
    private readonly dataSource;
    private readonly redisService;
    private readonly approvalChainService;
    private readonly auditService;
    constructor(dataSource: DataSource, redisService: RedisService, approvalChainService: ApprovalChainService, auditService: AuditService);
    getPolicy(tenantId: string): Promise<PolicyResponse>;
    updatePolicy(tenantId: string, userId: string, dto: UpdatePolicyDto): Promise<PolicyResponse>;
    getPolicyHistory(tenantId: string, limit?: number): Promise<PolicyChangeRecord[]>;
    getPolicyVersions(tenantId: string): Promise<PolicyVersionRecord[]>;
    getPolicyVersion(tenantId: string, version: number): Promise<PolicyVersionRecord>;
    restorePolicyVersion(tenantId: string, userId: string, version: number): Promise<PolicyResponse>;
    getClientPolicy(tenantId: string, clientId: string): Promise<ClientPolicyResponse>;
    setClientPolicy(tenantId: string, userId: string, clientId: string, dto: SetClientPolicyDto): Promise<ClientPolicyResponse>;
    deleteClientPolicy(tenantId: string, clientId: string, userId?: string): Promise<{
        ok: boolean;
    }>;
    listClientPolicies(tenantId: string): Promise<ClientPolicyResponse[]>;
}
