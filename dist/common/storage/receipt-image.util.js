"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIME_TO_EXT = void 0;
exports.mimeToExt = mimeToExt;
exports.saveReceiptImage = saveReceiptImage;
const fs = require("fs");
const path = require("path");
exports.MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/tiff': 'tiff',
    'image/bmp': 'bmp',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/heic-sequence': 'heics',
    'image/heif-sequence': 'heifs',
    'application/pdf': 'pdf',
};
function mimeToExt(mimeType) {
    return exports.MIME_TO_EXT[mimeType] ?? 'bin';
}
async function saveReceiptImage(buffer, mimeType, expenseId, uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads')) {
    const ext = mimeToExt(mimeType);
    const filename = `${expenseId}.${ext}`;
    const relPath = `receipts/${filename}`;
    const dir = path.join(uploadsDir, 'receipts');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, filename), buffer);
    return `/api/files/${relPath}`;
}
//# sourceMappingURL=receipt-image.util.js.map