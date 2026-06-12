"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const os = require("os");
const receipt_image_util_1 = require("../receipt-image.util");
const EXPENSE_ID = 'abc12345-0000-0000-0000-000000000001';
const JPEG_BUF = Buffer.from('fake-jpeg-bytes');
let tmpDir;
beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'reclaim-test-'));
});
afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
});
describe('mimeToExt', () => {
    test.each(Object.entries(receipt_image_util_1.MIME_TO_EXT))('maps %s → %s', (mime, ext) => {
        expect((0, receipt_image_util_1.mimeToExt)(mime)).toBe(ext);
    });
    test('returns "bin" for unknown mime type', () => {
        expect((0, receipt_image_util_1.mimeToExt)('application/octet-stream')).toBe('bin');
    });
});
describe('saveReceiptImage', () => {
    test('writes file to uploads/receipts/{expenseId}.{ext}', async () => {
        await (0, receipt_image_util_1.saveReceiptImage)(JPEG_BUF, 'image/jpeg', EXPENSE_ID, tmpDir);
        const filePath = path.join(tmpDir, 'receipts', `${EXPENSE_ID}.jpg`);
        const written = await fs.promises.readFile(filePath);
        expect(written).toEqual(JPEG_BUF);
    });
    test('creates the receipts/ sub-directory if it does not exist', async () => {
        const subDir = path.join(tmpDir, 'nested', 'uploads');
        await (0, receipt_image_util_1.saveReceiptImage)(JPEG_BUF, 'image/png', EXPENSE_ID, subDir);
        const exists = await fs.promises
            .access(path.join(subDir, 'receipts'))
            .then(() => true).catch(() => false);
        expect(exists).toBe(true);
    });
    test('returns /api/files/receipts/{expenseId}.{ext} URL', async () => {
        const url = await (0, receipt_image_util_1.saveReceiptImage)(JPEG_BUF, 'image/jpeg', EXPENSE_ID, tmpDir);
        expect(url).toBe(`/api/files/receipts/${EXPENSE_ID}.jpg`);
    });
    test('URL suffix matches FilesController LIKE pattern (%/receipts/{file})', async () => {
        const url = await (0, receipt_image_util_1.saveReceiptImage)(JPEG_BUF, 'image/png', EXPENSE_ID, tmpDir);
        const relPath = `receipts/${EXPENSE_ID}.png`;
        expect(url.endsWith(`/${relPath}`)).toBe(true);
    });
    test.each([
        ['image/jpeg', 'jpg'],
        ['image/png', 'png'],
        ['image/webp', 'webp'],
        ['application/pdf', 'pdf'],
    ])('uses correct extension for %s', async (mime, ext) => {
        const url = await (0, receipt_image_util_1.saveReceiptImage)(Buffer.from('x'), mime, EXPENSE_ID, tmpDir);
        expect(url).toMatch(new RegExp(`\\.${ext}$`));
    });
    test('overwrites an existing file for the same expenseId (idempotent)', async () => {
        const first = Buffer.from('first');
        const second = Buffer.from('second');
        await (0, receipt_image_util_1.saveReceiptImage)(first, 'image/jpeg', EXPENSE_ID, tmpDir);
        await (0, receipt_image_util_1.saveReceiptImage)(second, 'image/jpeg', EXPENSE_ID, tmpDir);
        const written = await fs.promises.readFile(path.join(tmpDir, 'receipts', `${EXPENSE_ID}.jpg`));
        expect(written).toEqual(second);
    });
});
//# sourceMappingURL=receipt-image.util.spec.js.map