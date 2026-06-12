import { Response } from 'express';
import { FeedbackService, CreateFeedbackDto } from './feedback.service';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    getWidget(res: Response): void;
    getAdminPage(res: Response): void;
    getPilotSummary(partnerIds: string, from?: string, to?: string): Promise<{
        partner_id: any;
        partner_name: any;
        is_active: any;
        client_count: any;
        active_employees: any;
        total_expenses: any;
        expenses_in_period: any;
        pending_expenses: any;
        approved_expenses: any;
        total_amount_vnd: any;
        last_activity: string;
        subscription_status: any;
        open_feedback: any;
    }[]>;
    list(query: Record<string, string>): Promise<{
        items: import("./feedback.service").FeedbackItem[];
        total: number;
    }>;
    create(body: CreateFeedbackDto, req: any): Promise<import("./feedback.service").FeedbackItem>;
    updateStatus(id: string, body: {
        status: any;
        admin_note?: string;
    }): Promise<import("./feedback.service").FeedbackItem>;
}
