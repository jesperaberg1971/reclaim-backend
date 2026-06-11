export declare enum OcrFailureReason {
    MISSING_AMOUNT = "missing_amount",
    MISSING_DATE = "missing_date",
    ZERO_AMOUNT = "zero_amount",
    FUTURE_DATE = "future_date",
    INVALID_DATE = "invalid_date",
    NO_TEXT_FOUND = "no_text_found",
    LOW_ENTITY_COUNT = "low_entity_count",
    NETWORK_ERROR = "network_error",
    API_QUOTA = "api_quota",
    CONFIGURATION = "configuration"
}
export interface OcrDiagnostics {
    raw_confidence: number;
    weighted_confidence: number;
    hitl_required: boolean;
    failure_reasons: OcrFailureReason[];
    missing_fields: string[];
    processing_ms: number;
    attempt: number;
}
