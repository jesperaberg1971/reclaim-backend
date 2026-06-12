import { Client } from './client.entity';
export declare class Employee {
    id: string;
    client: Client;
    client_id: string;
    employee_id: string;
    full_name: string;
    personal_bank_card_last4: string | null;
    pdpd_consent: boolean;
    is_active: boolean;
}
