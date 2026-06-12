import { Decimal } from 'decimal.js';
export interface TripDecisionPdfData {
    decisionNumber: string;
    companyName: string;
    companyAddress?: string;
    employeeFullName: string;
    employeeInternalId: string;
    employeePosition?: string;
    destination: string;
    purpose: string;
    startDate: Date;
    endDate: Date;
    dailyAllowanceVnd: Decimal;
    signedCity?: string;
    directorName?: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    reportFooter?: string | null;
}
export declare function buildTripDecisionHtml(data: TripDecisionPdfData): string;
