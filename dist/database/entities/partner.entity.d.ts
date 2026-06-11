import { Client } from './client.entity';
import { Subscription } from './subscription.entity';
export interface PartnerBranding {
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
    company_display_name: string | null;
    report_header: string | null;
    report_footer: string | null;
}
export declare const DEFAULT_BRANDING: PartnerBranding;
export interface PartnerPolicies {
    meal_cap_vnd: number;
    per_diem_daily_vnd: number;
    welfare_monthly_cap_vnd: number;
    personal_card_limit_vnd: number;
    allowed_categories: string[];
    require_original_receipt: boolean;
    require_manager_approval: boolean;
    approval_escalation_hours: number;
}
export declare class Partner {
    id: string;
    name: string;
    tax_code: string;
    policies: PartnerPolicies;
    branding: PartnerBranding | null;
    clients: Client[];
    subscriptions: Subscription[];
    is_active: boolean;
    created_at: Date;
}
