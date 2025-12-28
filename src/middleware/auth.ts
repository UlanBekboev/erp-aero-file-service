import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';

/**
 * Расширяем интерфейс Express Request
 * Добавляем поле user для хранения данных авторизованного пользователя
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        deviceId: string;
      };
    }
  }
}

/**
 * Middleware для проверки JWT токена
 *
 * Процесс:
 * 1. Извлекаем токен из заголовка Authorization
 * 2. Проверяем что токен не в blacklist (не заблокирован)
 * 3. Верифицируем подпись токена
 * 4. Добавляем данные пользователя в req.user
 *
 * Использование:
 * app.get('/protected', authMiddleware, handler);
 *
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Извлекаем заголовок Authorization
    const authHeader = req.headers.authorization;

    // Проверяем формат: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    // Извлекаем токен (убираем "Bearer ")
    const token = authHeader.split(' ')[1];

    // Проверяем blacklist (заблокированные токены после logout)
    const isRevoked = await TokenService.isTokenRevoked(token);
    if (isRevoked) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
      return;
    }

    // Верифицируем JWT токен (проверка подписи и срока действия)
    const decoded = TokenService.verifyToken(token);

    // Добавляем данные пользователя в Request
    // Теперь в контроллерах доступен req.user
    req.user = {
      id: decoded.userId,
      deviceId: decoded.deviceId
    };

    // Передаём управление следующему middleware/контроллеру
    next();
  } catch (error: any) {
    // Обработка ошибок JWT
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
