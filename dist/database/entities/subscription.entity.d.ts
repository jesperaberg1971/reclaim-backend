import { Partner } from './partner.entity';
import { Decimal } from 'decimal.js';
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'overdue' | 'cancelled';
export type PlanType = 'monthly' | 'annual';
export declare class Subscription {
    id: string;
    partner: Partner;
    partner_id: string;
    tier: string;
    monthly_price_vnd: Decimal;
    is_beta_pilot: boolean;
    next_billing_date: Date;
    status: SubscriptionStatus;
    plan_type: PlanType;
    trial_ends_at: Date | null;
    grace_period_ends_at: Date | null;
    cancelled_at: Date | null;
    created_at: Date;
}
