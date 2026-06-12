import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ExpenseRepository } from './repositories/expense.repository';
import { TripDecisionRepository } from './repositories/trip-decision.repository';
import { PartnerRepository } from './repositories/partner.repository';
import { PdfService } from '../pdf/pdf.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BrandingService } from '../branding/branding.service';
import { GateDecision, TripDecisionCtx } from './gate-engine/gate.types';
export declare class ReceiptProcessingService {
    private readonly expenseRepo;
    private readonly tripRepo;
    private readonly partnerRepo;
    private readonly pdfService;
    private readonly dataSource;
    private readonly notificationsService;
    private readonly brandingService;
    private readonly logger;
    constructor(expenseRepo: ExpenseRepository, tripRepo: TripDecisionRepository, partnerRepo: PartnerRepository, pdfService: PdfService, dataSource: DataSource, notificationsService: NotificationsService, brandingService: BrandingService);
    processExpense(expenseId: string, tenantId: string): Promise<GateDecision>;
    private attachTripDecisionPdf;
    private storePdfFailureMarker;
}
export declare function route(amount: Decimal, receiptDate: Date, trip: TripDecisionCtx | null, paymentMethod: 'cash' | 'card' | 'unknown', mealCap: Decimal, welfareMonthly: Decimal, welfareUsed: Decimal, cardLimit: Decimal, hasBankAccount: boolean): GateDecision;
export declare function applyPolicyCategoryRules(decision: GateDecision, allowedCategories: string[], requireOriginalReceipt: boolean, hasReceiptImage: boolean): GateDecision;
