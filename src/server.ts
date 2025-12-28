import dotenv from 'dotenv';
import app from './app';
import { testConnection } from './config/database';

// Загружаем переменные окружения из .env
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Запуск сервера
 *
 * Процесс:
 * 1. Проверяем подключение к БД
 * 2. Запускаем HTTP сервер
 * 3. Логируем информацию
 */
const startServer = async (): Promise<void> => {
  try {
    // Тестируем подключение к базе данных
    await testConnection();

    // Запускаем HTTP сервер
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Выход с кодом ошибки
  }
};

// Запускаем сервер
startServer();
