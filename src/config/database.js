const mysql = require('mysql2/promise');
require('dotenv').config();

// Создаём пул соединений с MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aero_files',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Функция для тестирования подключения
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = { pool, testConnection };
