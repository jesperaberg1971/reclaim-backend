import { Response } from 'express';
import { DataSource } from 'typeorm';
import { SpacesService } from '../../common/storage/spaces.service';
export declare class FilesController {
    private readonly dataSource;
    private readonly spacesService;
    private readonly uploadsDir;
    private readonly signingKey;
    constructor(dataSource: DataSource, spacesService: SpacesService);
    serveSignedFile(pathParam: string, expParam: string, sigParam: string, res: Response): Promise<void>;
    serveFile(subfolder: string, filename: string, req: any, res: Response): Promise<void>;
    private sendFile;
}
