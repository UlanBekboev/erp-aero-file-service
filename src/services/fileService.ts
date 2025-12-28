import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../models/File';
import { IFile } from '../types';

// Конфигурация хранилища из переменных окружения
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

/**
 * Сервис для работы с файлами
 * Управляет загрузкой, хранением и удалением файлов
 */
export class FileService {
  /**
   * Сохранить файл на диск и в БД
   *
   * Процесс:
   * 1. Генерируем уникальное имя (UUID + расширение)
   * 2. Сохраняем файл на диск
   * 3. Сохраняем метаданные в БД
   *
   * @param fileData - данные файла от multer
   * @param userId - ID владельца
   * @returns Сохранённый файл
   */
  static async saveFile(fileData: Express.Multer.File, userId: string): Promise<IFile> {
    const { originalname, buffer, mimetype, size } = fileData;

    // Извлекаем расширение файла
    const extension = path.extname(originalname).toLowerCase();

    // Генерируем уникальное имя для хранения
    // UUID гарантирует что имена не совпадут
    const storageName = `${uuidv4()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, storageName);

    // Сохраняем файл на диск
    await fs.writeFile(filePath, buffer);

    // Сохраняем метаданные в БД
    const fileRecord = await File.create({
      userId,
      originalName: originalname,
      storageName,
      extension,
      mimeType: mimetype,
      size
    });

    return fileRecord;
  }

  /**
   * Получить список файлов пользователя
   *
   * @param userId - ID пользователя
   * @param page - номер страницы
   * @param listSize - размер страницы
   * @returns Файлы и общее количество
   */
  static async getFileList(userId: string, page: number, listSize: number) {
    const result = await File.findByUserWithPagination(userId, page, listSize);
    return result;
  }

  /**
   * Получить информацию о файле
   *
   * @param fileId - ID файла
   * @param userId - ID владельца
   * @returns Информация о файле
   * @throws Error если файл не найден
   */
  static async getFileInfo(fileId: number, userId: string): Promise<IFile> {
    const file = await File.findById(fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    return file;
  }

  /**
   * Получить файл для скачивания
   *
   * @param fileId - ID файла
   * @param userId - ID владельца
   * @returns Путь к файлу и метаданные
   * @throws Error если файл не найден
   */
  static async getFileForDownload(fileId: number, userId: string) {
    const file = await File.findById(fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    const filePath = path.join(UPLOAD_DIR, file.storage_name);

    // Проверяем что файл существует на диске
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error('File not found on disk');
    }

    return {
      filePath,
      fileMeta: file
    };
  }

  /**
   * Удалить файл
   *
   * Процесс:
   * 1. Находим файл в БД
   * 2. Удаляем с диска
   * 3. Удаляем из БД
   *
   * @param fileId - ID файла
   * @param userId - ID владельца
   * @throws Error если файл не найден
   */
  static async deleteFile(fileId: number, userId: string): Promise<void> {
    const file = await File.findById(fileId, userId);

    if (!file) {
      throw new Error('File not found');
    }

    const filePath = path.join(UPLOAD_DIR, file.storage_name);

    // Удаляем с диска
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
      // Продолжаем даже если файл не найден на диске
    }

    // Удаляем из БД
    await File.delete(fileId, userId);
  }

  /**
   * Обновить файл
   *
   * Процесс:
   * 1. Находим старый файл
   * 2. Сохраняем новый файл на диск
   * 3. Обновляем запись в БД
   * 4. Удаляем старый файл с диска
   *
   * @param fileId - ID файла
   * @param userId - ID владельца
   * @param fileData - новый файл от multer
   * @returns Обновлённый файл
   * @throws Error если файл не найден
   */
  static async updateFile(
    fileId: number,
    userId: string,
    fileData: Express.Multer.File
  ): Promise<IFile> {
    const { originalname, buffer, mimetype, size } = fileData;

    // Получаем старый файл
    const oldFile = await File.findById(fileId, userId);

    if (!oldFile) {
      throw new Error('File not found');
    }

    // Генерируем новое имя
    const extension = path.extname(originalname).toLowerCase();
    const storageName = `${uuidv4()}${extension}`;
    const newFilePath = path.join(UPLOAD_DIR, storageName);

    // Сохраняем новый файл на диск
    await fs.writeFile(newFilePath, buffer);

    // Обновляем в БД
    const updated = await File.update(fileId, userId, {
      userId,
      originalName: originalname,
      storageName,
      extension,
      mimeType: mimetype,
      size
    });

    if (!updated) {
      // Откатываем: удаляем новый файл
      await fs.unlink(newFilePath);
      throw new Error('Failed to update file');
    }

    // Удаляем старый файл с диска
    const oldFilePath = path.join(UPLOAD_DIR, oldFile.storage_name);
    try {
      await fs.unlink(oldFilePath);
    } catch (error) {
      console.error('Error deleting old file:', error);
      // Продолжаем даже если старый файл не найден
    }

    // Получаем обновлённую запись
    const updatedFile = await File.findById(fileId, userId);
    return updatedFile!;
  }
}
