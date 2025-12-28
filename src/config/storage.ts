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

const config = {
  uploadDir: path.resolve(uploadDir),
  maxFileSize
};

console.log('DEBUG storage.ts: Exporting config =', config);

export const storageConfig = config;
export default config;
