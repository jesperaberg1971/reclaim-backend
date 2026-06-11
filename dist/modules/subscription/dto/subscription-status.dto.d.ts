import { Decimal } from 'decimal.js';
import { SubscriptionStatus, PlanType } from '../../../database/entities/subscription.entity';
export declare class SubscriptionStatusDto {
    tier: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
    monthlyPriceVnd: Decimal;
    clientCount: number;
    nextBillingDate: Date;
    isBetaPilot: boolean;
    discountPercentage: number;
    discountedPriceVnd: Decimal;
    pendingUpgrade?: {
        newTier: string;
        newPriceVnd: Decimal;
    };
    status: SubscriptionStatus;
    planType: PlanType;
    trialEndsAt: Date | null;
    gracePeriodEndsAt: Date | null;
}
