"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrFailureReason = void 0;
var OcrFailureReason;
(function (OcrFailureReason) {
    OcrFailureReason["MISSING_AMOUNT"] = "missing_amount";
    OcrFailureReason["MISSING_DATE"] = "missing_date";
    OcrFailureReason["ZERO_AMOUNT"] = "zero_amount";
    OcrFailureReason["FUTURE_DATE"] = "future_date";
    OcrFailureReason["INVALID_DATE"] = "invalid_date";
    OcrFailureReason["NO_TEXT_FOUND"] = "no_text_found";
    OcrFailureReason["LOW_ENTITY_COUNT"] = "low_entity_count";
    OcrFailureReason["NETWORK_ERROR"] = "network_error";
    OcrFailureReason["API_QUOTA"] = "api_quota";
    OcrFailureReason["CONFIGURATION"] = "configuration";
})(OcrFailureReason || (exports.OcrFailureReason = OcrFailureReason = {}));
//# sourceMappingURL=ocr-failure.types.js.map