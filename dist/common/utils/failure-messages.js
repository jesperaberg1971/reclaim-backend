"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FAILURE_MESSAGE = exports.FAILURE_MESSAGES = void 0;
exports.getFailureMessages = getFailureMessages;
exports.FAILURE_MESSAGES = {
    missing_amount: {
        title: 'Amount not found',
        detail: 'We could not detect a total amount on this receipt.',
        action: 'Please enter the amount manually in the correction form.',
    },
    missing_date: {
        title: 'Date not found',
        detail: 'The receipt date was missing or unclear.',
        action: 'Please verify and correct the date in the review form.',
    },
    zero_amount: {
        title: 'Amount reads as zero',
        detail: 'The detected amount was zero — the total may be printed in an unusual format.',
        action: 'Please enter the correct amount manually.',
    },
    future_date: {
        title: 'Date is in the future',
        detail: 'The receipt date appears to be a future date, which is likely an OCR error.',
        action: 'Please correct the date in the review form.',
    },
    invalid_date: {
        title: 'Unreadable date',
        detail: 'The date could not be parsed from the receipt.',
        action: 'Please enter the correct date manually.',
    },
    no_text_found: {
        title: 'Image unreadable',
        detail: 'No text could be extracted from this image.',
        action: 'Please re-upload a clearer photo — ensure the receipt is flat, well-lit, and in focus.',
    },
    low_entity_count: {
        title: 'Low image quality',
        detail: 'Very little information could be read from this receipt.',
        action: 'Try re-uploading with better lighting or from a flatter angle.',
    },
    network_error: {
        title: 'Processing delayed',
        detail: 'A network issue interrupted processing.',
        action: 'Your receipt has been queued for retry. Check back in a few minutes.',
    },
    api_quota: {
        title: 'Processing delayed',
        detail: 'High demand has temporarily delayed processing.',
        action: 'Your receipt will be processed shortly. Please check back soon.',
    },
    configuration: {
        title: 'System error',
        detail: 'A system configuration issue prevented processing.',
        action: 'Please contact support and quote your expense ID.',
    },
    image_expired: {
        title: 'Upload expired',
        detail: 'The receipt image expired before it could be processed (> 1 hour in queue).',
        action: 'Please re-upload the receipt.',
    },
};
exports.DEFAULT_FAILURE_MESSAGE = {
    title: 'Review required',
    detail: 'This receipt requires a brief manual review.',
    action: 'A reviewer will verify the details shortly — no action needed from you.',
};
function getFailureMessages(reasonCodes) {
    if (!reasonCodes?.length)
        return [];
    return reasonCodes.map((code) => exports.FAILURE_MESSAGES[code] ?? exports.DEFAULT_FAILURE_MESSAGE);
}
//# sourceMappingURL=failure-messages.js.map