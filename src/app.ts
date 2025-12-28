import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import { errorHandler } from './middleware/errorHandler';

/**
 * Создание и настройка Express приложения
 *
 * Middleware порядок важен:
 * 1. Безопасность (helmet, cors)
 * 2. Парсинг body (json, urlencoded)
 * 3. Логирование
 * 4. Маршруты
 * 5. 404 handler
 * 6. Error handler (всегда последний!)
 */

const app: Application = express();

// ===== БЕЗОПАСНОСТЬ =====

// Helmet - защита HTTP заголовков
app.use(helmet());

// CORS - разрешаем запросы с любых доменов
app.use(cors({
  origin: '*',                           // Любой домен
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// ===== ПАРСИНГ BODY =====

// JSON body parser
app.use(express.json());

// URL-encoded body parser (для форм)
app.use(express.urlencoded({ extended: true }));

// ===== ЛОГИРОВАНИЕ (только в dev) =====

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===== HEALTH CHECK =====

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

// ===== МАРШРУТЫ API =====

// Маршруты авторизации (/, /signup, /signin, /info, /logout)
app.use('/', authRoutes);

// Маршруты файлов (/file/upload, /file/list, etc.)
app.use('/file', fileRoutes);

// ===== 404 HANDLER =====

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ===== ERROR HANDLER =====
// Всегда последний middleware!

app.use(errorHandler);

export default app;
