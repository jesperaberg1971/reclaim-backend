import { DataSource } from 'typeorm';
export interface ExpenseComment {
    id: string;
    expense_id: string;
    user_id: string;
    user_email: string;
    user_role: string;
    body: string;
    created_at: string;
}
export declare class CommentsService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getComments(expenseId: string, tenantId: string, clientId?: string): Promise<ExpenseComment[]>;
    addComment(expenseId: string, userId: string, body: string, tenantId: string, clientId?: string): Promise<ExpenseComment>;
    getCommentsByExpenseIds(expenseIds: string[], tenantId: string): Promise<Map<string, ExpenseComment[]>>;
    private toComment;
}
