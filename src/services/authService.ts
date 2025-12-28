import { Request } from 'express';
import { User } from '../models/User';
import { TokenService } from './tokenService';
import { TokenPair } from '../types';

/**
 * Сервис авторизации
 * Бизнес-логика для регистрации, входа, выхода
 */
export class AuthService {
  /**
   * Валидация ID (email или номер телефона)
   *
   * Email: стандартный regex (name@domain.com)
   * Телефон: международный формат E.164 (+79001234567)
   *
   * @param id - email или телефон
   * @returns true если валидный
   */
  static validateId(id: string): boolean {
    // Regex для email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Regex для телефона (E.164 формат)
    // +[код страны][номер], например: +79001234567
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    return emailRegex.test(id) || phoneRegex.test(id);
  }

  /**
   * Регистрация нового пользователя
   *
   * Процесс:
   * 1. Валидация ID (email/телефон)
   * 2. Проверка что пользователь не существует
   * 3. Создание пользователя (хеширование пароля в модели)
   * 4. Генерация пары токенов для первого входа
   *
   * @param id - email или телефон
   * @param password - пароль (будет захеширован)
   * @param req - Express Request (для определения устройства)
   * @returns Пара токенов
   * @throws Error если ID невалидный или пользователь существует
   */
  static async signup(id: string, password: string, req: Request): Promise<TokenPair> {
    // Валидация формата ID
    if (!this.validateId(id)) {
      throw new Error('Invalid id format. Must be valid email or phone number');
    }

    // Проверка существования пользователя
    const exists = await User.exists(id);
    if (exists) {
      throw new Error('User already exists');
    }

    // Создание пользователя (пароль хешируется внутри модели)
    await User.create(id, password);

    // Генерация токенов для автоматического входа после регистрации
    const deviceId = TokenService.generateDeviceId(req);
    const tokens = await TokenService.generateTokenPair(id, deviceId);

    return tokens;
  }

  /**
   * Вход в систему
   *
   * Процесс:
   * 1. Проверка учётных данных (email/телефон + пароль)
   * 2. Генерация новой пары токенов для устройства
   *
   * Важно: Каждый вход создаёт НОВУЮ пару токенов
   * Старые токены с этого устройства продолжают работать до logout
   *
   * @param id - email или телефон
   * @param password - пароль
   * @param req - Express Request
   * @returns Пара токенов
   * @throws Error если учётные данные неверные
   */
  static async signin(id: string, password: string, req: Request): Promise<TokenPair> {
    // Проверка пароля (сравнение хешей в модели)
    const isValid = await User.verifyPassword(id, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Генерация токенов для устройства
    const deviceId = TokenService.generateDeviceId(req);
    const tokens = await TokenService.generateTokenPair(id, deviceId);

    return tokens;
  }

  /**
   * Выход из системы
   *
   * Блокирует токены только для ТЕКУЩЕГО устройства
   * Другие устройства пользователя продолжают работать
   *
   * Процесс:
   * 1. Находим все токены устройства
   * 2. Помечаем их как is_revoked = TRUE
   * 3. При следующем запросе middleware проверит blacklist
   *
   * @param userId - ID пользователя
   * @param deviceId - ID устройства
   */
  static async logout(userId: string, deviceId: string): Promise<void> {
    await TokenService.revokeDeviceTokens(userId, deviceId);
  }
}
