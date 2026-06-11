export declare class CreateInviteDto {
    email: string;
    role: 'employee' | 'client_admin';
    client_id?: string;
}
export declare class RedeemInviteDto {
    token: string;
    password: string;
    full_name?: string;
    employee_code?: string;
}
export interface InviteTokenResponse {
    token: string;
    invite_url: string;
    expires_at: string;
}
export interface RedeemInviteResponse {
    access_token: string;
    role: string;
}
