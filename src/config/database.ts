import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Создаём пул соединений с MySQL
// Пул - это набор переиспользуемых подключений к БД
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aero_files',
  waitForConnections: true,  // Ждать если все подключения заняты
  connectionLimit: 10,       // Максимум 10 одновременных подключений
  queueLimit: 0             // Без ограничения очереди
});

// Тестируем подключение к базе данных
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release(); // Возвращаем подключение в пул
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
};
