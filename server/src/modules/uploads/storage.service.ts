import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { env } from '@/config/env';

export interface FileStorageService {
  saveImage(file: Express.Multer.File, folder: string): Promise<string>;
}

export class LocalFileStorageService implements FileStorageService {
  async saveImage(file: Express.Multer.File, folder: string) {
    const extension = path.extname(file.originalname) || '.bin';
    const filename = `${randomUUID()}${extension}`;
    const targetDir = path.resolve(process.cwd(), env.UPLOAD_DIR, folder);
    const targetPath = path.join(targetDir, filename);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, file.buffer);

    return `/uploads/${folder}/${filename}`;
  }
}

export const fileStorageService = new LocalFileStorageService();
