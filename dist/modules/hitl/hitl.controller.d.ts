import { Response } from 'express';
import { HitlService } from './hitl.service';
import { OcrCorrectionDto } from './dto/ocr-correction.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { RejectReasonDto } from './dto/reject-reason.dto';
export declare class HitlController {
    private readonly hitlService;
    constructor(hitlService: HitlService);
    adminScreen(res: Response): Promise<void>;
    getQueue(req: any): Promise<import("./hitl.service").ReviewQueueItem[]>;
    bulkAction(dto: BulkActionDto, req: any): Promise<import("./hitl.service").BulkResult>;
    getDetail(expenseId: string, req: any): Promise<import("./hitl.service").ExpenseDetail>;
    getOcrMetrics(period?: string): Promise<import("../../common/redis/redis.service").OcrMetrics>;
    applyCorrection(expenseId: string, dto: OcrCorrectionDto, req: any): Promise<import("./hitl.service").CorrectionResult>;
    rejectExpense(expenseId: string, dto: RejectReasonDto, req: any): Promise<{
        expenseId: string;
        status: string;
    }>;
}
