import { DataSource } from 'typeorm';
import { FeedbackType, FeedbackStatus } from '../../database/entities/feedback.entity';
export declare class CreateFeedbackDto {
    type: FeedbackType;
    title: string;
    body?: string;
    page_url?: string;
}
export interface FeedbackItem {
    id: string;
    partner_id: string | null;
    partner_name: string | null;
    user_id: string | null;
    user_role: string | null;
    type: FeedbackType;
    title: string;
    body: string | null;
    page_url: string | null;
    status: FeedbackStatus;
    admin_note: string | null;
    created_at: string;
}
export interface ListFeedbackQuery {
    status?: FeedbackStatus;
    type?: FeedbackType;
    partner_id?: string;
    limit?: number;
    offset?: number;
}
export declare class FeedbackService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    create(dto: CreateFeedbackDto, context: {
        partnerId: string | null;
        userId: string | null;
        userRole: string | null;
    }): Promise<FeedbackItem>;
    list(query: ListFeedbackQuery): Promise<{
        items: FeedbackItem[];
        total: number;
    }>;
    updateStatus(id: string, status: FeedbackStatus, adminNote?: string): Promise<FeedbackItem>;
    getPilotSummary(partnerIds: string[], from?: string, to?: string): Promise<{
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
    private toItem;
}
