import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  saveFile(buffer: Buffer, originalName: string): string {
    this.ensureUploadsDir();
    const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    fs.writeFileSync(path.join(this.uploadsDir, fileName), buffer);
    return fileName;
  }

  getFilePath(fileKey: string): string {
    return path.join(this.uploadsDir, fileKey);
  }

  fileExists(fileKey: string): boolean {
    return fs.existsSync(this.getFilePath(fileKey));
  }

  /** Avances del seed (seed/...) o archivos subidos en uploads/ */
  canAnalyze(fileKey: string): boolean {
    return this.fileExists(fileKey) || fileKey.startsWith('seed/');
  }

  saveBuffer(buffer: Buffer, fileName: string): string {
    this.ensureUploadsDir();
    fs.writeFileSync(path.join(this.uploadsDir, fileName), buffer);
    return fileName;
  }
}
