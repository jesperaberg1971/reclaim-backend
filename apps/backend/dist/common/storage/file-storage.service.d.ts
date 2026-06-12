import { SpacesService } from './spaces.service';
export declare class FileStorageService {
    private readonly spacesService;
    private readonly logger;
    private readonly uploadsDir;
    constructor(spacesService: SpacesService);
    saveFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;
}
