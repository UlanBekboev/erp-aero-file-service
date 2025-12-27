# ERP.AERO File Service

REST API сервис с авторизацией по JWT и управлением файлами.

## Описание

Проект создан согласно техническому заданию:
- Работа с Node.js и Express.js
- Реализация JWT авторизации с refresh токенами
- Работа с файлами и базой данных MySQL

## Технологии

- **Node.js** - JavaScript runtime для серверной разработки
- **Express.js** - минималистичный веб-фреймворк
- **MySQL** - реляционная база данных
- **JWT** - JSON Web Tokens для авторизации
- **Bcrypt** - хеширование паролей
- **Multer** - загрузка файлов

## Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd erp-aero-file-service

# Установить зависимости
npm install

# Создать .env файл
cp .env.example .env

# Настроить переменные окружения в .env
```

## Запуск

```bash
# Development режим
npm run dev

# Production режим
npm start
```
