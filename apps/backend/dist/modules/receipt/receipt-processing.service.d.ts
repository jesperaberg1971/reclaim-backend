import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ExpenseRepository } from './repositories/expense.repository';
import { TripDecisionRepository } from './repositories/trip-decision.repository';
import { PartnerRepository } from './repositories/partner.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { GateDecision, TripDecisionCtx } from './gate-engine/gate.types';
export declare class ReceiptProcessingService {
    private readonly expenseRepo;
    private readonly tripRepo;
    private readonly partnerRepo;
    private readonly dataSource;
    private readonly notificationsService;
    private readonly pdfQueue;
    private readonly logger;
    constructor(expenseRepo: ExpenseRepository, tripRepo: TripDecisionRepository, partnerRepo: PartnerRepository, dataSource: DataSource, notificationsService: NotificationsService, pdfQueue: Queue);
    processExpense(expenseId: string, tenantId: string): Promise<GateDecision>;
    private enqueuePdfGeneration;
}
export declare function route(amount: Decimal, receiptDate: Date, trip: TripDecisionCtx | null, paymentMethod: 'cash' | 'card' | 'unknown', mealCap: Decimal, welfareMonthly: Decimal, welfareUsed: Decimal, cardLimit: Decimal, hasBankAccount: boolean): GateDecision;
export declare function applyPolicyCategoryRules(decision: GateDecision, allowedCategories: string[], requireOriginalReceipt: boolean, hasReceiptImage: boolean): GateDecision;
