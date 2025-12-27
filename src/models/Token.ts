import { pool } from '../config/database';
import { IToken, CreateTokenDTO } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Модель Token - работа с JWT и Refresh токенами
 */
export class Token {
  /**
   * Создать токен
   * @param tokenData - данные токена
   * @returns ID созданной записи
   */
  static async create(tokenData: CreateTokenDTO): Promise<number> {
    const { userId, deviceId, refreshToken, jwtToken, expiresAt } = tokenData;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tokens (user_id, device_id, refresh_token, jwt_token, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, deviceId, refreshToken, jwtToken, expiresAt]
    );

    return result.insertId;
  }

  /**
   * Найти токен по refresh токену
   * @param refreshToken - refresh токен
   * @returns Токен или undefined
   */
  static async findByRefreshToken(refreshToken: string): Promise<IToken | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tokens
       WHERE refresh_token = ? AND is_revoked = FALSE AND expires_at > NOW()`,
      [refreshToken]
    );

    return rows[0] as IToken | undefined;
  }

  /**
   * Проверить заблокирован ли JWT токен
   * @param jwtToken - JWT токен
   * @returns true если заблокирован
   */
  static async isJwtRevoked(jwtToken: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM tokens
       WHERE jwt_token = ? AND is_revoked = TRUE
       LIMIT 1`,
      [jwtToken]
    );

    return rows.length > 0;
  }

  /**
   * Заблокировать токены устройства
   * @param userId - ID пользователя
   * @param deviceId - ID устройства
   * @returns Количество заблокированных токенов
   */
  static async revokeByDevice(userId: string, deviceId: string): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tokens
       SET is_revoked = TRUE
       WHERE user_id = ? AND device_id = ? AND is_revoked = FALSE`,
      [userId, deviceId]
    );

    return result.affectedRows;
  }

  /**
   * Заблокировать все токены пользователя
   * @param userId - ID пользователя
   * @returns Количество заблокированных токенов
   */
  static async revokeAllUserTokens(userId: string): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tokens
       SET is_revoked = TRUE
       WHERE user_id = ? AND is_revoked = FALSE`,
      [userId]
    );

    return result.affectedRows;
  }

  /**
   * Обновить JWT токен
   * @param refreshToken - refresh токен
   * @param newJwtToken - новый JWT токен
   * @returns true если обновлён
   */
  static async updateJwtToken(refreshToken: string, newJwtToken: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tokens
       SET jwt_token = ?
       WHERE refresh_token = ?`,
      [newJwtToken, refreshToken]
    );

    return result.affectedRows > 0;
  }

  /**
   * Удалить истёкшие токены (очистка БД)
   * @returns Количество удалённых записей
   */
  static async cleanupExpired(): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tokens WHERE expires_at < NOW()'
    );

    return result.affectedRows;
  }
}
