"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionColumnTransformer = void 0;
const crypto = require("crypto");
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
function getKey() {
    const hex = process.env.ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
}
class EncryptionColumnTransformer {
    to(plaintext) {
        if (plaintext == null)
            return null;
        const key = getKey();
        const iv = crypto.randomBytes(IV_BYTES);
        const cipher = crypto.createCipheriv(ALGO, key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
    }
    from(ciphertext) {
        if (ciphertext == null)
            return null;
        const parts = ciphertext.split(':');
        if (parts.length !== 3)
            return null;
        try {
            const key = getKey();
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = Buffer.from(parts[2], 'hex');
            const decipher = crypto.createDecipheriv(ALGO, key, iv);
            decipher.setAuthTag(tag);
            return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
        }
        catch {
            return null;
        }
    }
}
exports.EncryptionColumnTransformer = EncryptionColumnTransformer;
//# sourceMappingURL=encryption-column.transformer.js.map