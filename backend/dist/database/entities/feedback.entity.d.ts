export type FeedbackType = 'bug' | 'question' | 'suggestion';
export type FeedbackStatus = 'open' | 'acknowledged' | 'resolved';
export declare class Feedback {
    id: string;
    partner_id: string | null;
    user_id: string | null;
    user_role: string | null;
    type: FeedbackType;
    title: string;
    body: string | null;
    page_url: string | null;
    status: FeedbackStatus;
    admin_note: string | null;
    created_at: Date;
}
