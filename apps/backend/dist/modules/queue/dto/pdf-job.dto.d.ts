export interface PdfJobData {
    expenseId: string;
    tenantId: string;
    expense: {
        employee_id: string;
        client_id: string;
    };
    tripRow: {
        destination: string;
        purpose: string;
        start_date: string;
        end_date: string;
        daily_allowance_amount: string;
    };
}
