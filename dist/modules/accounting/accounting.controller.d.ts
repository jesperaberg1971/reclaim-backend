import { Response } from 'express';
import { AuditService } from '../../common/audit/audit.service';
import { AccountingService } from './accounting.service';
import { CommentsService } from './comments.service';
import { DocumentZipQueryDto } from './dto/document-zip-query.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { ExpenseNoteDto } from './dto/expense-note.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { SpendingQueryDto, PerformanceQueryDto, ReportExportQueryDto } from './dto/analytics-query.dto';
export declare class AccountingController {
    private readonly service;
    private readonly commentsService;
    private readonly auditService;
    private readonly logger;
    constructor(service: AccountingService, commentsService: CommentsService, auditService: AuditService);
    dashboard(res: Response): void;
    listExpenses(req: any, dto: ListExpensesQueryDto): Promise<import("./accounting.service").PagedExpenses>;
    unmarkReviewed(id: string, req: any): Promise<{
        ok: boolean;
        expenseId: string;
        status: string;
    }>;
    rejectExpense(id: string, req: any, dto: ExpenseNoteDto): Promise<{
        ok: boolean;
        expenseId: string;
        decision: string;
        decidedAt: string;
    }>;
    markReviewed(id: string, req: any, dto: ExpenseNoteDto): Promise<{
        ok: boolean;
        expenseId: string;
        decision: string;
        decidedAt: string;
    }>;
    getDetail(id: string, req: any): Promise<import("./accounting.service").AccountingExpenseDetail>;
    getComments(id: string, req: any): Promise<import("./comments.service").ExpenseComment[]>;
    addComment(id: string, req: any, dto: AddCommentDto): Promise<import("./comments.service").ExpenseComment>;
    listClients(req: any): Promise<{
        id: string;
        name: string;
    }[]>;
    listEmployees(req: any): Promise<{
        id: string;
        name: string;
        employee_id: string;
    }[]>;
    getDashboardMetrics(req: any, q: Record<string, string>): Promise<import("./accounting.service").DashboardMetrics>;
    getRecentExports(req: any): Promise<import("./accounting.service").RecentExport[]>;
    downloadDocZip(req: any, dto: DocumentZipQueryDto, res: Response): Promise<void>;
    getSummary(req: any, dto: SummaryQueryDto): Promise<import("./accounting.service").PeriodSummary>;
    getSpendingBreakdown(req: any, dto: SpendingQueryDto): Promise<import("./accounting.service").SpendingBreakdown>;
    getGatePerformance(req: any, dto: PerformanceQueryDto): Promise<import("./accounting.service").GatePerformanceReport>;
    getClientInsights(req: any, dto: SummaryQueryDto): Promise<import("./accounting.service").ClientInsightsReport>;
    exportAnalyticsReport(req: any, dto: ReportExportQueryDto, res: Response): Promise<void>;
}
