import { ApprovalChainService } from './approval-chain.service';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
export declare class ApprovalChainController {
    private readonly service;
    constructor(service: ApprovalChainService);
    getPendingQueue(req: any): Promise<import("./approval-chain.service").ApprovalQueueItem[]>;
    getChain(req: any, expenseId: string): Promise<import("./approval-chain.service").ApprovalChainResponse>;
    approve(req: any, expenseId: string, dto: ApprovalActionDto): Promise<import("./approval-chain.service").ApprovalChainResponse>;
    reject(req: any, expenseId: string, dto: ApprovalActionDto): Promise<import("./approval-chain.service").ApprovalChainResponse>;
    bulkApprove(req: any, dto: BulkActionDto): Promise<import("./approval-chain.service").BulkActionResult>;
    bulkReject(req: any, dto: BulkActionDto): Promise<import("./approval-chain.service").BulkActionResult>;
}
