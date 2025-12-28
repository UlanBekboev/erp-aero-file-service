import express from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  signupValidation,
  signinValidation,
  refreshTokenValidation
} from '../middleware/validation';

const router = express.Router();

/**
 * Маршруты авторизации
 *
 * Публичные (без токена):
 * - POST /signup - регистрация
 * - POST /signin - вход
 * - POST /signin/new_token - обновление токена
 *
 * Защищённые (требуют токен):
 * - GET /info - информация о пользователе
 * - GET /logout - выход
 */

// Публичные маршруты
router.post('/signup', signupValidation, AuthController.signup);
router.post('/signin', signinValidation, AuthController.signin);
router.post('/signin/new_token', refreshTokenValidation, AuthController.refreshToken);

// Защищённые маршруты (требуют authMiddleware)
router.get('/info', authMiddleware, AuthController.info);
router.get('/logout', authMiddleware, AuthController.logout);

export default router;
