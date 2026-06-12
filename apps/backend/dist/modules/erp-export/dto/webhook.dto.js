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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterWebhookDto = exports.WEBHOOK_EVENTS = void 0;
const class_validator_1 = require("class-validator");
exports.WEBHOOK_EVENTS = [
    'export.completed',
    'export.batch.completed',
];
class RegisterWebhookDto {
}
exports.RegisterWebhookDto = RegisterWebhookDto;
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ['https', 'http'], require_tld: false }),
    (0, class_validator_1.Matches)(/^https?:\/\//i, { message: 'url must use http or https' }),
    (0, class_validator_1.Matches)(/^(?!https?:\/\/(localhost|127\.|0\.0\.0\.0|::1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.))/i, { message: 'Webhook URL must not target a private or loopback address' }),
    __metadata("design:type", String)
], RegisterWebhookDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(exports.WEBHOOK_EVENTS, { each: true }),
    __metadata("design:type", Array)
], RegisterWebhookDto.prototype, "events", void 0);
//# sourceMappingURL=webhook.dto.js.map