import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { IUser } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Модель User - работа с пользователями в БД
 * Использует паттерн Static Class (все методы статические)
 */
export class User {
  /**
   * Создать нового пользователя
   * @param id - email или телефон
   * @param password - пароль в открытом виде
   * @returns Созданный пользователь
   */
  static async create(id: string, password: string): Promise<IUser> {
    // Хешируем пароль с помощью bcrypt (10 раундов salt)
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query<ResultSetHeader>(
      'INSERT INTO users (id, password_hash) VALUES (?, ?)',
      [id, passwordHash]
    );

    return { id, password_hash: passwordHash };
  }

  /**
   * Найти пользователя по ID
   * @param id - email или телефон
   * @returns Пользователь или undefined
   */
  static async findById(id: string): Promise<IUser | undefined> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return rows[0] as IUser | undefined;
  }

  /**
   * Проверить пароль пользователя
   * @param id - email или телефон
   * @param password - пароль для проверки
   * @returns true если пароль верный
   */
  static async verifyPassword(id: string, password: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      return false;
    }

    // Сравниваем хеши паролей
    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * Проверить существует ли пользователь
   * @param id - email или телефон
   * @returns true если существует
   */
  static async exists(id: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    return rows.length > 0;
  }
}
