export declare const MIME_TO_EXT: Record<string, string>;
export declare function mimeToExt(mimeType: string): string;
export declare function saveReceiptImage(buffer: Buffer, mimeType: string, expenseId: string, uploadsDir?: string): Promise<string>;
