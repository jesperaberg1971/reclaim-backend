"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrConfigurationError = exports.OcrNonRetryableError = exports.OcrRetryableError = exports.OcrService = void 0;
exports.isRetryableOcrError = isRetryableOcrError;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const documentai_1 = require("@google-cloud/documentai");
const ocr_failure_types_1 = require("./ocr-failure.types");
const SUPPORTED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/bmp',
    'image/webp',
    'application/pdf',
]);
const FIELD_WEIGHTS = {
    total_amount: 0.45,
    invoice_date: 0.30,
    supplier_name: 0.15,
    currency: 0.05,
    __baseline__: 0.05,
};
let OcrService = OcrService_1 = class OcrService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(OcrService_1.name);
        const location = config.get('GOOGLE_CLOUD_LOCATION', 'us');
        const credsJson = config.get('GOOGLE_CREDENTIALS_JSON');
        const credentials = credsJson ? JSON.parse(credsJson) : undefined;
        this.client = new documentai_1.DocumentProcessorServiceClient({
            apiEndpoint: `${location}-documentai.googleapis.com`,
            ...(credentials && { credentials }),
        });
    }
    async extractFromImage(imageBuffer, mimeType = 'image/jpeg', attempt = 1) {
        const projectId = this.config.get('GOOGLE_CLOUD_PROJECT_ID');
        const location = this.config.get('GOOGLE_CLOUD_LOCATION', 'asia-southeast1');
        const processorId = this.config.get('GOOGLE_DOCUMENT_AI_PROCESSOR_ID');
        if (!projectId || !processorId) {
            throw new OcrConfigurationError('Google Document AI is not configured (missing env vars).');
        }
        if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
            throw new OcrNonRetryableError(`Unsupported file type: ${mimeType}`);
        }
        if (imageBuffer.length < 1_000) {
            throw new OcrNonRetryableError(`Image too small (${imageBuffer.length} bytes) — likely corrupt or blank.`);
        }
        const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;
        this.logger.log(`OCR attempt ${attempt}: ${mimeType} (${imageBuffer.length} bytes)`);
        const t0 = Date.now();
        const [result] = await this.client.processDocument({
            name: processorName,
            rawDocument: {
                content: imageBuffer.toString('base64'),
                mimeType,
            },
            skipHumanReview: true,
        });
        const processingMs = Date.now() - t0;
        const doc = result.document;
        if (!doc) {
            throw new OcrNonRetryableError('Document AI returned no document object.');
        }
        return this.parseDocument(doc, processingMs, attempt);
    }
    parseDocument(doc, processingMs, attempt) {
        const entities = doc.entities ?? [];
        const rawText = doc.text ?? '';
        const find = (type) => entities.find((e) => e.type === type);
        const supplierEntity = find('supplier_name');
        const amountEntity = find('total_amount');
        const dateEntity = find('invoice_date');
        const currencyEntity = find('currency');
        const amountMoney = amountEntity?.normalizedValue?.moneyValue;
        let amount = 0;
        if (amountMoney?.units) {
            amount = parseInt(amountMoney.units, 10) + (amountMoney.nanos ?? 0) / 1e9;
        }
        else if (amountEntity?.mentionText) {
            amount = parseVietnameseAmount(amountEntity.mentionText);
        }
        if (amount === 0 && rawText) {
            amount = extractLargestAmountFromText(rawText);
        }
        let date = new Date().toISOString();
        let dateFallback = true;
        const dv = dateEntity?.normalizedValue?.dateValue;
        if (dv?.year && dv?.month && dv?.day) {
            const parsed = new Date(dv.year, dv.month - 1, dv.day);
            if (!isNaN(parsed.getTime())) {
                date = parsed.toISOString();
                dateFallback = false;
            }
        }
        else if (dateEntity?.mentionText) {
            const parsed = parseVietnameseDate(dateEntity.mentionText);
            if (parsed) {
                date = parsed;
                dateFallback = false;
            }
        }
        if (dateFallback && rawText) {
            const parsed = parseVietnameseDate(rawText);
            if (parsed) {
                date = parsed;
                dateFallback = false;
            }
        }
        const currency = currencyEntity?.mentionText ?? 'VND';
        const vendor = supplierEntity?.normalizedValue?.text
            ?? supplierEntity?.mentionText
            ?? null;
        const failureReasons = [];
        const missingFields = [];
        if (!rawText.trim() || entities.length < 2) {
            failureReasons.push(!rawText.trim()
                ? ocr_failure_types_1.OcrFailureReason.NO_TEXT_FOUND
                : ocr_failure_types_1.OcrFailureReason.LOW_ENTITY_COUNT);
        }
        if (amount === 0) {
            failureReasons.push(!amountEntity ? ocr_failure_types_1.OcrFailureReason.MISSING_AMOUNT : ocr_failure_types_1.OcrFailureReason.ZERO_AMOUNT);
            missingFields.push('total_amount');
        }
        if (dateFallback) {
            failureReasons.push(ocr_failure_types_1.OcrFailureReason.MISSING_DATE);
            missingFields.push('invoice_date');
        }
        else {
            const receiptDate = new Date(date);
            if (receiptDate > new Date()) {
                failureReasons.push(ocr_failure_types_1.OcrFailureReason.FUTURE_DATE);
            }
        }
        if (!vendor)
            missingFields.push('supplier_name');
        const rawConfidence = entities.length > 0
            ? entities.reduce((s, e) => s + (e.confidence ?? 0), 0) / entities.length
            : 0;
        let weightedConfidence = FIELD_WEIGHTS.__baseline__;
        if (amount > 0 && amountEntity) {
            weightedConfidence += FIELD_WEIGHTS.total_amount * (amountEntity.confidence ?? 0.5);
        }
        if (!dateFallback && dateEntity) {
            weightedConfidence += FIELD_WEIGHTS.invoice_date * (dateEntity.confidence ?? 0.5);
        }
        if (vendor && supplierEntity) {
            weightedConfidence += FIELD_WEIGHTS.supplier_name * (supplierEntity.confidence ?? 0.5);
        }
        if (currencyEntity) {
            weightedConfidence += FIELD_WEIGHTS.currency;
        }
        const hitlRequired = failureReasons.length > 0;
        const diagnostics = {
            raw_confidence: rawConfidence,
            weighted_confidence: weightedConfidence,
            hitl_required: hitlRequired,
            failure_reasons: failureReasons,
            missing_fields: missingFields,
            processing_ms: processingMs,
            attempt,
        };
        this.logger.log(`OCR complete — vendor="${vendor ?? '?'}", amount=${amount}, ` +
            `weighted_conf=${weightedConfidence.toFixed(2)}, ` +
            `hitl=${hitlRequired}` +
            (failureReasons.length ? `, reasons=[${failureReasons.join(',')}]` : ''));
        return {
            vendor,
            amount,
            currency,
            date,
            rawText,
            entities: entities.map((e) => ({
                type: e.type,
                mention: e.mentionText,
                confidence: e.confidence,
                normalized: e.normalizedValue,
            })),
            confidence: weightedConfidence,
            diagnostics,
        };
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OcrService);
class OcrRetryableError extends Error {
    constructor(message) {
        super(message);
        this.isRetryable = true;
        this.name = 'OcrRetryableError';
    }
}
exports.OcrRetryableError = OcrRetryableError;
class OcrNonRetryableError extends Error {
    constructor(message) {
        super(message);
        this.isRetryable = false;
        this.name = 'OcrNonRetryableError';
    }
}
exports.OcrNonRetryableError = OcrNonRetryableError;
class OcrConfigurationError extends OcrNonRetryableError {
    constructor(message) { super(message); this.name = 'OcrConfigurationError'; }
}
exports.OcrConfigurationError = OcrConfigurationError;
function isRetryableOcrError(err) {
    if ('isRetryable' in err)
        return err.isRetryable;
    const msg = err.message.toLowerCase();
    return (msg.includes('econnreset') ||
        msg.includes('enotfound') ||
        msg.includes('timeout') ||
        msg.includes('unavailable') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('503') ||
        msg.includes('502'));
}
function parseVietnameseAmount(text) {
    const cleaned = text
        .replace(/[đĐ]/g, '')
        .replace(/VNĐ|VND|vnđ|vnd/gi, '')
        .replace(/\s/g, '')
        .trim();
    const dotMatch = cleaned.match(/^[\d.]+$/);
    const commaMatch = cleaned.match(/^[\d,]+$/);
    if (dotMatch) {
        const parts = cleaned.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            return parseInt(cleaned.replace(/\./g, ''), 10) || 0;
        }
        return parseFloat(cleaned) || 0;
    }
    if (commaMatch) {
        const parts = cleaned.split(',');
        if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            return parseInt(cleaned.replace(/,/g, ''), 10) || 0;
        }
        return parseFloat(cleaned.replace(/,/g, '.')) || 0;
    }
    return parseFloat(cleaned.replace(/[^\d.]/g, '')) || 0;
}
function extractLargestAmountFromText(text) {
    const matches = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?\s*(?:đ|VNĐ|VND)?/gi) ?? [];
    let largest = 0;
    for (const m of matches) {
        const v = parseVietnameseAmount(m.trim());
        if (v > largest && v < 100_000_000)
            largest = v;
    }
    return largest;
}
function parseVietnameseDate(text) {
    const match = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
    if (!match)
        return null;
    const [, day, month, year] = match;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(d.getTime()))
        return null;
    if (d.getFullYear() < 2020 || d > new Date())
        return null;
    return d.toISOString();
}
//# sourceMappingURL=ocr.service.js.map