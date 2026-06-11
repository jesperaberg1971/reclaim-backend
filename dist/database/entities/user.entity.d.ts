import { Partner } from './partner.entity';
import { Client } from './client.entity';
export declare class User {
    id: string;
    email: string;
    password_hash: string;
    role: 'partner_admin' | 'client_admin' | 'employee' | 'super_admin';
    partnerId?: string;
    partner?: Partner;
    clientId?: string;
    client?: Client;
    is_active: boolean;
    created_at: Date;
}
