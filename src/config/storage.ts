import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10); // 50MB

// Создаём директорию для загрузок если её нет
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const storageConfig = {
  uploadDir: path.resolve(uploadDir),
  maxFileSize
};
