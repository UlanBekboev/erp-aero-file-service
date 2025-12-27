import { pool } from '../config/database';
import { IFile, CreateFileDTO, PaginatedFiles } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Модель File - работа с файлами в БД
 */
export class File {
  /**
   * Создать запись о файле
   * @param fileData - данные файла
   * @returns Созданная запись с ID
   */
  static async create(fileData: CreateFileDTO): Promise<IFile> {
    const { userId, originalName, storageName, extension, mimeType, size } = fileData;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO files (user_id, original_name, storage_name, extension, mime_type, size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, originalName, storageName, extension, mimeType, size]
    );

    return {
      id: result.insertId,
      user_id: userId,
      original_name: originalName,
      storage_name: storageName,
      extension,
      mime_type: mimeType,
      size
    };
  }

  /**
   * Найти файл по ID и владельцу
   * @param id - ID файла
   * @param userId - ID владельца
   * @returns Файл или undefined
   */
  static async findById(id: number, userId: string): Promise<IFile | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM files WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return rows[0] as IFile | undefined;
  }

  /**
   * Получить файлы пользователя с пагинацией
   * @param userId - ID пользователя
   * @param page - номер страницы (начиная с 1)
   * @param limit - количество файлов на странице
   * @returns Файлы и общее количество
   */
  static async findByUserWithPagination(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedFiles> {
    const offset = (page - 1) * limit;

    // Получаем файлы
    const [files] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM files
       WHERE user_id = ?
       ORDER BY upload_date DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Получаем общее количество
    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM files WHERE user_id = ?',
      [userId]
    );

    return {
      files: files as IFile[],
      totalCount: countResult[0].total
    };
  }

  /**
   * Удалить файл
   * @param id - ID файла
   * @param userId - ID владельца
   * @returns true если удалён
   */
  static async delete(id: number, userId: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM files WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Обновить файл
   * @param id - ID файла
   * @param userId - ID владельца
   * @param fileData - новые данные
   * @returns true если обновлён
   */
  static async update(
    id: number,
    userId: string,
    fileData: CreateFileDTO
  ): Promise<boolean> {
    const { originalName, storageName, extension, mimeType, size } = fileData;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE files
       SET original_name = ?, storage_name = ?, extension = ?,
           mime_type = ?, size = ?, upload_date = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [originalName, storageName, extension, mimeType, size, id, userId]
    );

    return result.affectedRows > 0;
  }
}
