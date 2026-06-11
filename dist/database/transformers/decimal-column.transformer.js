"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalColumnTransformer = void 0;
const decimal_js_1 = require("decimal.js");
class DecimalColumnTransformer {
    to(value) {
        if (value === null || value === undefined)
            return null;
        return new decimal_js_1.default(value).toFixed(4);
    }
    from(value) {
        if (value === null || value === undefined)
            return null;
        return new decimal_js_1.default(value);
    }
}
exports.DecimalColumnTransformer = DecimalColumnTransformer;
//# sourceMappingURL=decimal-column.transformer.js.map