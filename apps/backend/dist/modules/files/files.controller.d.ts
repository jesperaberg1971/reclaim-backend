import { Response } from 'express';
import { DataSource } from 'typeorm';
export declare class FilesController {
    private readonly dataSource;
    private readonly uploadsDir;
    private readonly signingKey;
    constructor(dataSource: DataSource);
    serveSignedFile(pathParam: string, expParam: string, sigParam: string, res: Response): Promise<void>;
    serveFile(subfolder: string, filename: string, req: any, res: Response): Promise<void>;
    private sendFile;
}
