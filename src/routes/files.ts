import express from 'express';
import multer from 'multer';
import { FileController } from '../controllers/fileController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * Настройка Multer для загрузки файлов
 *
 * memoryStorage - файл хранится в RAM (буфер)
 * Альтернатива: diskStorage - сразу на диск
 *
 * Используем memory потому что:
 * 1. Нужно генерировать уникальное имя (UUID)
 * 2. Нужно сохранить метаданные в БД
 * 3. Если БД упадёт - можем откатить
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10) // 50MB
  }
});

/**
 * Маршруты для работы с файлами
 *
 * Все маршруты требуют авторизации (authMiddleware)
 */

// Применяем authMiddleware ко всем маршрутам
router.use(authMiddleware);

// Маршруты файлов
router.post('/upload', upload.single('file'), FileController.upload);
router.get('/list', FileController.list);
router.get('/download/:id', FileController.download);
router.get('/:id', FileController.getInfo);
router.delete('/delete/:id', FileController.delete);
router.put('/update/:id', upload.single('file'), FileController.update);

export default router;
