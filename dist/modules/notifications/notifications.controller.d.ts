import { NotificationsService } from './notifications.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    list(req: any): Promise<import("./notifications.service").AppNotification[]>;
    count(req: any): Promise<{
        unread: number;
    }>;
    markRead(id: string, req: any): Promise<{
        ok: boolean;
    }>;
    markAllRead(req: any): Promise<{
        ok: boolean;
    }>;
    getSettings(req: any): Promise<import("./notifications.service").NotificationSettings>;
    updateSettings(req: any, dto: UpdateNotificationSettingsDto): Promise<import("./notifications.service").NotificationSettings>;
}
