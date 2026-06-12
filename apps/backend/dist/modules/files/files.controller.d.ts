import { Response } from 'express';
import { DataSource } from 'typeorm';
export declare class FilesController {
    private readonly dataSource;
    private readonly uploadsDir;
    constructor(dataSource: DataSource);
    serveFile(subfolder: string, filename: string, req: any, res: Response): Promise<void>;
}
