import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/fileService';

/**
 * Контроллер для работы с файлами
 * Обрабатывает загрузку, скачивание, обновление и удаление файлов
 */
export class FileController {
  /**
   * POST /file/upload - Загрузка файла
   *
   * Headers:
   * Authorization: Bearer <token>
   * Content-Type: multipart/form-data
   *
   * Form data:
   * file: <binary>
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "File uploaded successfully",
   *   "data": {
   *     "id": 1,
   *     "name": "document.pdf",
   *     "extension": ".pdf",
   *     "mimeType": "application/pdf",
   *     "size": 524288,
   *     "uploadDate": "2024-01-15T10:30:00.000Z"
   *   }
   * }
   */
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Файл добавлен multer middleware
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const file = await FileService.saveFile(req.file, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: file.id,
          name: file.original_name,
          extension: file.extension,
          mimeType: file.mime_type,
          size: file.size,
          uploadDate: file.upload_date
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /file/list - Список файлов с пагинацией
   *
   * Query params:
   * - page: номер страницы (default: 1)
   * - list_size: размер страницы (default: 10)
   *
   * Example: /file/list?page=2&list_size=20
   *
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "page": 2,
   *     "listSize": 20,
   *     "totalPages": 5,
   *     "totalCount": 95,
   *     "files": [...]
   *   }
   * }
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const listSize = parseInt(req.query.list_size as string) || 10;

      const { files, totalCount } = await FileService.getFileList(
        req.user!.id,
        page,
        listSize
      );

      res.json({
        success: true,
        data: {
          page,
          listSize,
          totalPages: Math.ceil(totalCount / listSize),
          totalCount,
          files: files.map(file => ({
            id: file.id,
            name: file.original_name,
            extension: file.extension,
            mimeType: file.mime_type,
            size: file.size,
            uploadDate: file.upload_date
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /file/:id - Информация о файле
   *
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "id": 1,
   *     "name": "document.pdf",
   *     "extension": ".pdf",
   *     "mimeType": "application/pdf",
   *     "size": 524288,
   *     "uploadDate": "2024-01-15T10:30:00.000Z"
   *   }
   * }
   */
  static async getInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      const file = await FileService.getFileInfo(fileId, req.user!.id);

      res.json({
        success: true,
        data: {
          id: file.id,
          name: file.original_name,
          extension: file.extension,
          mimeType: file.mime_type,
          size: file.size,
          uploadDate: file.upload_date
        }
      });
    } catch (error: any) {
      if (error.message === 'File not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /file/download/:id - Скачивание файла
   *
   * Response: binary file with headers
   * - Content-Type: <mime_type>
   * - Content-Disposition: attachment; filename="..."
   */
  static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      const { filePath, fileMeta } = await FileService.getFileForDownload(
        fileId,
        req.user!.id
      );

      // Устанавливаем заголовки для скачивания
      res.setHeader('Content-Type', fileMeta.mime_type);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileMeta.original_name)}"`
      );
      res.setHeader('Content-Length', fileMeta.size);

      // Отправляем файл
      res.sendFile(filePath);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /file/delete/:id - Удаление файла
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "File deleted successfully"
   * }
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = parseInt(req.params.id);
      await FileService.deleteFile(fileId, req.user!.id);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error: any) {
      if (error.message === 'File not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /file/update/:id - Обновление файла
   *
   * Headers:
   * Authorization: Bearer <token>
   * Content-Type: multipart/form-data
   *
   * Form data:
   * file: <binary>
   *
   * Response: аналогично upload
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const fileId = parseInt(req.params.id);
      const updatedFile = await FileService.updateFile(
        fileId,
        req.user!.id,
        req.file
      );

      res.json({
        success: true,
        message: 'File updated successfully',
        data: {
          id: updatedFile.id,
          name: updatedFile.original_name,
          extension: updatedFile.extension,
          mimeType: updatedFile.mime_type,
          size: updatedFile.size,
          uploadDate: updatedFile.upload_date
        }
      });
    } catch (error: any) {
      if (error.message === 'File not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }
}
