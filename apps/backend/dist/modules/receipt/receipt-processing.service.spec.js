"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const receipt_processing_service_1 = require("./receipt-processing.service");
const expense_repository_1 = require("./repositories/expense.repository");
const trip_decision_repository_1 = require("./repositories/trip-decision.repository");
const partner_repository_1 = require("./repositories/partner.repository");
const redis_service_1 = require("../../common/redis/redis.service");
const decimal_js_1 = require("decimal.js");
describe('ReceiptProcessingService – 3-Gate Salvage Engine', () => {
    let service;
    let tripRepo;
    let expenseRepo;
    let partnerRepo;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                receipt_processing_service_1.ReceiptProcessingService,
                { provide: trip_decision_repository_1.TripDecisionRepository, useValue: { findActiveTrip: jest.fn() } },
                { provide: expense_repository_1.ExpenseRepository, useValue: { getMonthlyMealTotal: jest.fn() } },
                { provide: partner_repository_1.PartnerRepository, useValue: { findByClientId: jest.fn() } },
                { provide: redis_service_1.RedisService, useValue: { decrementDailyAllowance: jest.fn() } },
            ],
        }).compile();
        service = module.get(receipt_processing_service_1.ReceiptProcessingService);
        tripRepo = module.get(trip_decision_repository_1.TripDecisionRepository);
        expenseRepo = module.get(expense_repository_1.ExpenseRepository);
        partnerRepo = module.get(partner_repository_1.PartnerRepository);
    });
    it('Gate 1 – matches active trip and deducts from Redis balance', async () => {
        tripRepo.findActiveTrip.mockResolvedValue({ id: 'trip-123' });
        const ocr = { date: new Date(), amount: new decimal_js_1.Decimal('450000'), paymentMethod: 'cash' };
        const result = await service.processReceipt('img.jpg', 'emp-1', 'client-1', ocr);
        expect(result.gate).toBe(1);
        expect(result.finalCategory).toBe('travel_allowance');
        expect(result.finalAmountDeductible.equals(new decimal_js_1.Decimal('450000'))).toBe(true);
        expect(result.pitFlag).toBe(false);
    });
    it('Gate 2 – exactly at 1.2M VND meal cap boundary (property-style test)', async () => {
        tripRepo.findActiveTrip.mockResolvedValue(null);
        partnerRepo.findByClientId.mockResolvedValue({ policies: { meal_cap: '1200000' } });
        expenseRepo.getMonthlyMealTotal.mockResolvedValue(new decimal_js_1.Decimal('750000'));
        const ocr = { date: new Date(), amount: new decimal_js_1.Decimal('450000'), paymentMethod: 'cash' };
        const result = await service.processReceipt('img.jpg', 'emp-1', 'client-1', ocr);
        expect(result.gate).toBe(2);
        expect(result.finalCategory).toBe('welfare_allowance');
        expect(result.finalAmountDeductible.equals(new decimal_js_1.Decimal('450000'))).toBe(true);
    });
    it('Gate 2 – exceeds cap → excess PIT-flagged', async () => {
        tripRepo.findActiveTrip.mockResolvedValue(null);
        partnerRepo.findByClientId.mockResolvedValue({ policies: { meal_cap: '1200000' } });
        expenseRepo.getMonthlyMealTotal.mockResolvedValue(new decimal_js_1.Decimal('900000'));
        const ocr = { date: new Date(), amount: new decimal_js_1.Decimal('500000'), paymentMethod: 'cash' };
        const result = await service.processReceipt('img.jpg', 'emp-1', 'client-1', ocr);
        expect(result.gate).toBe(2);
        expect(result.pitFlag).toBe(true);
        expect(result.finalAmountDeductible.equals(new decimal_js_1.Decimal('300000'))).toBe(true);
    });
    it('Gate 3 – personal card → auto reimbursement', async () => {
        tripRepo.findActiveTrip.mockResolvedValue(null);
        partnerRepo.findByClientId.mockResolvedValue({ policies: { meal_cap: '1200000' } });
        expenseRepo.getMonthlyMealTotal.mockResolvedValue(new decimal_js_1.Decimal('0'));
        const ocr = {
            date: new Date(),
            amount: new decimal_js_1.Decimal('300000'),
            paymentMethod: 'card',
            cardLast4: '4242',
        };
        const result = await service.processReceipt('img.jpg', 'emp-1', 'client-1', ocr);
        expect(result.gate).toBe(3);
        expect(result.finalCategory).toBe('personal_card_reimbursement');
    });
});
//# sourceMappingURL=receipt-processing.service.spec.js.map