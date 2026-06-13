"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FileStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const spaces_service_1 = require("./spaces.service");
let FileStorageService = FileStorageService_1 = class FileStorageService {
    constructor(spacesService) {
        this.spacesService = spacesService;
        this.logger = new common_1.Logger(FileStorageService_1.name);
        this.uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads');
    }
    async saveFile(key, buffer, mimeType) {
        if (process.env.STORAGE_PROVIDER === 'spaces') {
            const url = await this.spacesService.uploadFile(key, buffer, mimeType);
            this.logger.debug(`Saved ${key} to Spaces (${buffer.length} bytes)`);
            return url;
        }
        const dir = path.join(this.uploadsDir, path.dirname(key));
        const filepath = path.join(this.uploadsDir, key);
        if (!filepath.startsWith(this.uploadsDir + path.sep)) {
            throw new Error(`Invalid storage key: ${key}`);
        }
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(filepath, buffer);
        this.logger.debug(`Saved ${key} to local disk`);
        return `/api/files/${key}`;
    }
};
exports.FileStorageService = FileStorageService;
exports.FileStorageService = FileStorageService = FileStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [spaces_service_1.SpacesService])
], FileStorageService);
//# sourceMappingURL=file-storage.service.js.map