import { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handler Middleware
 *
 * Централизованная обработка всех ошибок приложения
 * Вызывается когда в любом месте произошла необработанная ошибка
 *
 * Использование:
 * app.use(errorHandler); // В конце всех routes
 *
 * @param err - Объект ошибки
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Логируем ошибку в консоль
  console.error('Error:', err);

  // Определяем статус код (по умолчанию 500)
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Обработка специфичных ошибок

  // Ошибки валидации (например, из express-validator)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // Дубликат записи в БД (UNIQUE constraint)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Файл слишком большой (от multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
  }

  // Отправляем ответ клиенту
  res.status(statusCode).json({
    success: false,
    message,
    // В development режиме отправляем stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
