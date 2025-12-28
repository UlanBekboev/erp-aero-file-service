import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для проверки результатов валидации
 *
 * Используется совместно с express-validator
 * Если есть ошибки валидации - возвращает 400 Bad Request
 */
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  next();
};

/**
 * Валидация для регистрации (signup)
 *
 * Правила:
 * - id (email/телефон) обязателен, должен быть строкой
 * - password обязателен, минимум 6 символов
 */
export const signupValidation = [
  body('id')
    .notEmpty()
    .withMessage('ID is required')
    .isString()
    .withMessage('ID must be a string'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  validate
];

/**
 * Валидация для входа (signin)
 *
 * Правила:
 * - id обязателен
 * - password обязателен
 */
export const signinValidation = [
  body('id')
    .notEmpty()
    .withMessage('ID is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate
];

/**
 * Валидация для обновления токена
 *
 * Правила:
 * - refreshToken обязателен
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),

  validate
];
