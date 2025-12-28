import dotenv from 'dotenv';
import { StringValue } from 'ms';

dotenv.config();

// Конфигурация JWT токенов
export const jwtConfig: {
  secret: string;
  expiresIn: StringValue | number;
  refreshTokenExpiresDays: number;
} = {
  secret: process.env.JWT_SECRET || 'default_secret_key',
  expiresIn: (process.env.JWT_EXPIRES_IN || '10m') as StringValue,
  refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10)
};
