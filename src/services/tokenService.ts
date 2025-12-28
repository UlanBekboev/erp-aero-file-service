import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request } from 'express';
import { StringValue } from 'ms';
import { Token } from '../models/Token';
import { TokenPair } from '../types';

// JWT конфигурация из переменных окружения
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN: StringValue = (process.env.JWT_EXPIRES_IN || '10m') as StringValue;
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);

/**
 * Сервис для работы с JWT и Refresh токенами
 * Отвечает за генерацию, проверку и обновление токенов
 */
export class TokenService {
  /**
   * Генерирует уникальный ID устройства на основе User-Agent и IP
   * Используется для различения устройств одного пользователя
   *
   * @param req - Express Request объект
   * @returns SHA256 хеш от User-Agent + IP
   */
  static generateDeviceId(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.socket.remoteAddress || '';

    // Создаём hash для уникальной идентификации устройства
    return crypto.createHash('sha256')
      .update(`${userAgent}-${ip}`)
      .digest('hex');
  }

  /**
   * Генерирует пару токенов: JWT (access) + Refresh
   *
   * JWT токен:
   * - Короткий срок жизни (10 минут)
   * - Содержит userId и deviceId
   * - Используется для авторизации запросов
   *
   * Refresh токен:
   * - Длинный срок жизни (7 дней)
   * - Случайная строка (64 байта)
   * - Используется для обновления JWT
   *
   * @param userId - ID пользователя (email или телефон)
   * @param deviceId - ID устройства
   * @returns Пара токенов
   */
  static async generateTokenPair(userId: string, deviceId: string): Promise<TokenPair> {
    // Проверяем что JWT secret настроен
    if (!JWT_SECRET) {
      throw new Error('JWT secret is not configured');
    }

    // Генерируем JWT токен
    const jwtToken = jwt.sign(
      { userId, deviceId },              // Payload (данные в токене)
      JWT_SECRET,                        // Секретный ключ для подписи
      { expiresIn: JWT_EXPIRES_IN }      // Время жизни: 10 минут
    );

    // Генерируем refresh токен (случайная строка)
    const refreshToken = crypto.randomBytes(64).toString('hex');

    // Вычисляем дату истечения refresh токена
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    // Сохраняем токены в БД
    await Token.create({
      userId,
      deviceId,
      refreshToken,
      jwtToken,
      expiresAt
    });

    return {
      token: jwtToken,
      refreshToken
    };
  }

  /**
   * Обновляет JWT токен используя refresh токен
   *
   * Процесс:
   * 1. Проверяем что refresh токен валидный (не заблокирован, не истёк)
   * 2. Генерируем новый JWT токен
   * 3. Обновляем JWT в БД
   *
   * @param refreshToken - Refresh токен
   * @returns Новый JWT токен
   * @throws Error если refresh токен невалидный
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    // Ищем токен в БД
    const tokenRecord = await Token.findByRefreshToken(refreshToken);

    if (!tokenRecord) {
      throw new Error('Invalid or expired refresh token');
    }

    // Проверяем что JWT secret настроен
    if (!JWT_SECRET) {
      throw new Error('JWT secret is not configured');
    }

    // Генерируем новый JWT токен с теми же данными
    const newJwtToken = jwt.sign(
      { userId: tokenRecord.user_id, deviceId: tokenRecord.device_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Обновляем JWT в базе
    await Token.updateJwtToken(refreshToken, newJwtToken);

    return { token: newJwtToken };
  }

  /**
   * Проверяет JWT токен и возвращает его содержимое
   *
   * @param token - JWT токен
   * @returns Декодированные данные (userId, deviceId)
   * @throws Error если токен невалидный
   */
  static verifyToken(token: string): { userId: string; deviceId: string } {
    // Проверяем что JWT secret настроен
    if (!JWT_SECRET) {
      throw new Error('JWT secret is not configured');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        deviceId: string;
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Блокирует токены конкретного устройства
   * Используется при logout - блокируем только текущее устройство
   *
   * @param userId - ID пользователя
   * @param deviceId - ID устройства
   */
  static async revokeDeviceTokens(userId: string, deviceId: string): Promise<void> {
    await Token.revokeByDevice(userId, deviceId);
  }

  /**
   * Блокирует ВСЕ токены пользователя
   * Используется редко (например, при смене пароля)
   *
   * @param userId - ID пользователя
   */
  static async revokeAllTokens(userId: string): Promise<void> {
    await Token.revokeAllUserTokens(userId);
  }

  /**
   * Проверяет заблокирован ли JWT токен
   *
   * @param token - JWT токен
   * @returns true если токен в blacklist
   */
  static async isTokenRevoked(token: string): Promise<boolean> {
    return await Token.isJwtRevoked(token);
  }
}
