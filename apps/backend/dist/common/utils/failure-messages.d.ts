export interface FailureMessage {
    title: string;
    detail: string;
    action: string;
}
export declare const FAILURE_MESSAGES: Record<string, FailureMessage>;
export declare const DEFAULT_FAILURE_MESSAGE: FailureMessage;
export declare function getFailureMessages(reasonCodes: string[]): FailureMessage[];
