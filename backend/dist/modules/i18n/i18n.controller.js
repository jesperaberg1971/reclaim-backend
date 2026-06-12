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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const vi_locale_1 = require("./vi.locale");
const LOCALES = {
    vi: vi_locale_1.VI_LOCALE,
};
let I18nController = class I18nController {
    getLocale(locale) {
        const data = LOCALES[locale];
        if (!data)
            throw new common_1.NotFoundException(`Locale '${locale}' not found`);
        return data;
    }
};
exports.I18nController = I18nController;
__decorate([
    (0, common_1.Get)(':locale'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('locale')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], I18nController.prototype, "getLocale", null);
exports.I18nController = I18nController = __decorate([
    (0, common_1.Controller)('i18n')
], I18nController);
//# sourceMappingURL=i18n.controller.js.map