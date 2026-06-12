"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toIso = toIso;
function toIso(d) {
    if (d == null)
        return null;
    return d instanceof Date ? d.toISOString() : d;
}
//# sourceMappingURL=date.js.map