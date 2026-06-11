import { Client } from './client.entity';
import { Employee } from './employee.entity';
import { Decimal } from 'decimal.js';
export declare enum ExpenseStatus {
    PENDING_OCR = "pending_ocr",
    PROCESSING = "processing",
    COMPLETE = "complete",
    NEEDS_REVIEW = "needs_review",
    FAILED = "failed",
    APPROVED = "approved",
    REJECTED = "rejected",
    ERP_EXPORTED = "erp_exported"
}
export declare enum ExpenseCategory {
    TRAVEL_ALLOWANCE = "travel_allowance",
    WELFARE_ALLOWANCE = "welfare_allowance",
    PERSONAL_CARD_REIMBURSEMENT = "personal_card_reimbursement",
    FLAGGED = "flagged"
}
export declare class Expense {
    id: string;
    parent_expense: Expense | null;
    parent_expense_id: string | null;
    client: Client;
    client_id: string;
    employee: Employee;
    employee_id: string;
    receipt_image_url: string;
    ocr_raw_json: any;
    original_amount: Decimal;
    currency: string;
    receipt_date: Date;
    gate_applied: number;
    final_category: string;
    final_amount_deductible: Decimal;
    pit_flag: boolean;
    erp_exported: boolean;
    status: ExpenseStatus;
    supporting_documents: SupportingDocument[];
    created_at: Date;
    accountant_reviewed_at: Date | null;
    accountant_reviewed_by: string | null;
    reviewer_note: string | null;
    approval_decision: 'approved' | 'rejected' | null;
}
export interface SupportingDocument {
    type: 'trip_decision_pdf' | 'receipt_image';
    url: string;
    filename?: string;
    generated_at: string;
}
