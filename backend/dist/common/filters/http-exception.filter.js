"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const isProd = process.env.NODE_ENV === 'production';
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected error occurred.';
        let error = 'Internal Server Error';
        let details;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
                error = common_1.HttpStatus[statusCode] ?? error;
            }
            else if (typeof body === 'object' && body !== null) {
                const b = body;
                if (Array.isArray(b.message)) {
                    details = flattenValidationErrors(b.message);
                    message = 'Validation failed. Please check the highlighted fields.';
                }
                else {
                    message = typeof b.message === 'string' ? b.message : message;
                }
                error = typeof b.error === 'string' ? b.error : (common_1.HttpStatus[statusCode] ?? error);
            }
        }
        else if (isMulterError(exception)) {
            const code = exception.code;
            if (code === 'LIMIT_FILE_SIZE') {
                statusCode = common_1.HttpStatus.PAYLOAD_TOO_LARGE;
                error = 'File Too Large';
                message = 'The file exceeds the 20 MB limit. Please compress or resize your image and try again.';
            }
            else if (code === 'LIMIT_UNEXPECTED_FILE') {
                statusCode = common_1.HttpStatus.BAD_REQUEST;
                error = 'Bad Request';
                message = 'Unexpected file field. Use the "image" field for receipt uploads.';
            }
            else if (code === 'LIMIT_FILE_COUNT') {
                statusCode = common_1.HttpStatus.BAD_REQUEST;
                error = 'Bad Request';
                message = 'Only one file may be uploaded at a time.';
            }
            else {
                statusCode = common_1.HttpStatus.BAD_REQUEST;
                error = 'Upload Error';
                message = 'Upload failed. Please try again.';
            }
        }
        else {
            this.logger.error(`Unhandled exception [${req.method} ${req.url}]: ${exception?.message}`, exception?.stack);
            if (!isProd && exception instanceof Error) {
                message = exception.message;
            }
        }
        res.status(statusCode).json({
            statusCode,
            error,
            message,
            ...(details ? { details } : {}),
            timestamp: new Date().toISOString(),
            path: req.url,
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
function flattenValidationErrors(messages) {
    const out = {};
    for (const msg of messages) {
        const spaceIdx = msg.indexOf(' ');
        const field = spaceIdx > 0 ? msg.slice(0, spaceIdx) : 'input';
        const text = spaceIdx > 0 ? capitalise(msg.slice(spaceIdx + 1)) : msg;
        (out[field] = out[field] ?? []).push(text);
    }
    return out;
}
function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function isMulterError(err) {
    return (typeof err === 'object' &&
        err !== null &&
        err.constructor?.name === 'MulterError');
}
//# sourceMappingURL=http-exception.filter.js.map