import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
export interface AppNotification {
    id: string;
    type: 'ready_for_review' | 'expense_approved' | 'expense_rejected' | 'manager_approval_required' | 'accountant_step_ready';
    title: string;
    body: string;
    resource_type: string | null;
    resource_id: string | null;
    read_at: string | null;
    created_at: string;
}
export interface NotificationSettings {
    email_enabled: boolean;
}
export declare class NotificationsService {
    private readonly dataSource;
    private readonly configService;
    private readonly logger;
    constructor(dataSource: DataSource, configService: ConfigService);
    getNotifications(userId: string): Promise<AppNotification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markRead(notificationId: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    getSettings(userId: string): Promise<NotificationSettings>;
    updateSettings(userId: string, emailEnabled: boolean): Promise<NotificationSettings>;
    notifyReadyForReview(tenantId: string, expenseId: string): Promise<void>;
    notifyManagerApprovalRequired(tenantId: string, expenseId: string): Promise<void>;
    notifyAccountantStepReady(tenantId: string, expenseId: string): Promise<void>;
    notifyExpenseDecision(expenseId: string, tenantId: string, decision: 'approved' | 'rejected', note?: string): Promise<void>;
    private fetchNotificationContext;
    private dispatchEmails;
    private createForUsers;
    private sendEmail;
    private toNotification;
}
