"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdpdModule = void 0;
const common_1 = require("@nestjs/common");
const pdpd_controller_1 = require("./pdpd.controller");
const pdpd_service_1 = require("./pdpd.service");
let PdpdModule = class PdpdModule {
};
exports.PdpdModule = PdpdModule;
exports.PdpdModule = PdpdModule = __decorate([
    (0, common_1.Module)({
        controllers: [pdpd_controller_1.PdpdController],
        providers: [pdpd_service_1.PdpdService],
        exports: [pdpd_service_1.PdpdService],
    })
], PdpdModule);
//# sourceMappingURL=pdpd.module.js.map