import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';

/**
 * Контроллер авторизации
 * Обрабатывает HTTP запросы и вызывает сервисы
 *
 * Паттерн: Controller → Service → Model
 * - Controller: обработка HTTP (req/res)
 * - Service: бизнес-логика
 * - Model: работа с БД
 */
export class AuthController {
  /**
   * POST /signup - Регистрация нового пользователя
   *
   * Request body:
   * {
   *   "id": "test@example.com",
   *   "password": "password123"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "User registered successfully",
   *   "data": {
   *     "token": "eyJhbGc...",
   *     "refreshToken": "a1b2c3..."
   *   }
   * }
   */
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, password } = req.body;

      // Вызываем сервис регистрации
      const tokens = await AuthService.signup(id, password, req);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: tokens
      });
    } catch (error: any) {
      // Специфичная обработка ошибок
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      // Передаём дальше в errorHandler middleware
      next(error);
    }
  }

  /**
   * POST /signin - Вход в систему
   *
   * Request body:
   * {
   *   "id": "test@example.com",
   *   "password": "password123"
   * }
   *
   * Response: аналогично signup
   */
  static async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, password } = req.body;

      const tokens = await AuthService.signin(id, password, req);

      res.json({
        success: true,
        message: 'Signed in successfully',
        data: tokens
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }

      next(error);
    }
  }

  /**
   * POST /signin/new_token - Обновление JWT токена
   *
   * Request body:
   * {
   *   "refreshToken": "a1b2c3..."
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "Token refreshed successfully",
   *   "data": {
   *     "token": "eyJhbGc..."
   *   }
   * }
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await TokenService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error: any) {
      if (error.message.includes('Invalid or expired')) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }

      next(error);
    }
  }

  /**
   * GET /info - Получение информации о текущем пользователе
   *
   * Headers:
   * Authorization: Bearer <token>
   *
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "test@example.com"
   *   }
   * }
   */
  static async info(req: Request, res: Response): Promise<void> {
    // req.user добавлен auth middleware
    res.json({
      success: true,
      data: {
        id: req.user!.id
      }
    });
  }

  /**
   * GET /logout - Выход из системы
   *
   * Headers:
   * Authorization: Bearer <token>
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "Logged out successfully"
   * }
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, deviceId } = req.user!;

      await AuthService.logout(id, deviceId);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
