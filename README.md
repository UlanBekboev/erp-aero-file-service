# ERP.AERO File Service

REST API сервис для управления файлами с JWT авторизацией.

## 📋 Описание

Сервис реализует REST API для:
- Регистрации и авторизации пользователей
- Управления файлами (загрузка, скачивание, удаление, обновление)
- JWT токенизации с refresh токенами
- Многоустройственного доступа

## 🛠 Технологический стек

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **MySQL** - база данных
- **JWT** - авторизация
- **Bcrypt** - хеширование паролей
- **Multer** - загрузка файлов

## 📦 Установка и запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить базу данных MySQL

Убедитесь, что MySQL запущен (например, в Docker):

```bash
docker run --name erp-aero-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=erp_aero_files \
  -e MYSQL_USER=erp_user \
  -e MYSQL_PASSWORD=erp_password \
  -p 3306:3306 \
  -d mysql:8.0
```

### 3. Создать файл `.env`

Создайте `.env` в корне проекта (пример в `.env.example`):

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=erp_user
DB_PASSWORD=erp_password
DB_NAME=erp_aero_files

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=10m
REFRESH_TOKEN_EXPIRES_DAYS=7

# Сервер
PORT=5000
NODE_ENV=development

# Файлы
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

### 4. Запустить миграции

```bash
npm run migrate
```

### 5. Запустить сервер

**Development режим** (с hot-reload):
```bash
npm run dev
```

**Production режим**:
```bash
npm run build
npm start
```

Сервер запустится на http://localhost:5000

## 📚 API Endpoints

### Авторизация

#### POST `/signup`
Регистрация нового пользователя

**Body:**
```json
{
  "id": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "abc123..."
  }
}
```

---

#### POST `/signin`
Вход в систему

**Body:**
```json
{
  "id": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "abc123..."
  }
}
```

---

#### POST `/signin/new_token`
Обновление JWT токена по refresh токену

**Body:**
```json
{
  "refreshToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc..."
  }
}
```

---

#### GET `/info`
Получить информацию о текущем пользователе

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user@example.com"
  }
}
```

---

#### GET `/logout`
Выход из системы (блокирует токены текущего устройства)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Файлы

Все файловые эндпоинты требуют авторизации (`Authorization: Bearer <jwt_token>`)

#### POST `/file/upload`
Загрузка файла

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (form-data):**
```
file: <file>
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "user_id": "user@example.com",
    "original_name": "document.pdf",
    "storage_name": "uuid-v4.pdf",
    "extension": ".pdf",
    "mime_type": "application/pdf",
    "size": 12345,
    "upload_date": "2025-12-28T12:00:00.000Z"
  }
}
```

---

#### GET `/file/list?page=1&list_size=10`
Получить список файлов с пагинацией

**Query параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `list_size` - размер страницы (по умолчанию: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [...],
    "pagination": {
      "page": 1,
      "listSize": 10,
      "total": 25
    }
  }
}
```

---

#### GET `/file/:id`
Информация о файле

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "original_name": "document.pdf",
    "extension": ".pdf",
    "mime_type": "application/pdf",
    "size": 12345,
    "upload_date": "2025-12-28T12:00:00.000Z"
  }
}
```

---

#### GET `/file/download/:id`
Скачать файл

**Response:**
- Файл в виде attachment (браузер начнёт скачивание)

---

#### PUT `/file/update/:id`
Обновить файл

**Headers:**
```
Content-Type: multipart/form-data
```

**Body:**
```
file: <new_file>
```

**Response:**
```json
{
  "success": true,
  "message": "File updated successfully",
  "data": { ... }
}
```

---

#### DELETE `/file/delete/:id`
Удалить файл

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## 🔐 Безопасность

- JWT токены действительны **10 минут**
- Refresh токены действительны **7 дней**
- Пароли хешируются с помощью bcrypt (10 раундов соли)
- CORS настроен для доступа с любого домена
- Helmet для защиты HTTP заголовков
- Валидация всех входящих данных

## 🚀 Многоустройственный доступ

- Каждое устройство получает уникальный `device_id` (хеш от User-Agent + IP)
- При logout блокируются только токены текущего устройства
- Другие устройства продолжают работать с активными токенами

## 📁 Структура проекта

```
src/
├── config/          # Конфигурация (БД, JWT, хранилище)
├── controllers/     # Контроллеры (обработка запросов)
├── middleware/      # Middleware (авторизация, валидация, ошибки)
├── models/          # Модели данных (User, File, Token)
├── routes/          # Маршруты API
├── scripts/         # Скрипты (миграции)
├── services/        # Бизнес-логика
├── types/           # TypeScript типы
├── app.ts           # Express приложение
└── server.ts        # HTTP сервер
```

## 🧪 Тестирование

### Примеры запросов (curl)

**Регистрация:**
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{"id":"test@example.com","password":"password123"}'
```

**Вход:**
```bash
curl -X POST http://localhost:5000/signin \
  -H "Content-Type: application/json" \
  -d '{"id":"test@example.com","password":"password123"}'
```

**Загрузка файла:**
```bash
curl -X POST http://localhost:5000/file/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

**Список файлов:**
```bash
curl http://localhost:5000/file/list?page=1&list_size=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Git история

Проект разработан с использованием feature-branch workflow:

1. `typescript-setup` - настройка TypeScript, package.json, конфигурация
2. `database-models` - модели данных (User, File, Token)
3. `auth-services` - сервисы авторизации и middleware
4. `controllers-routes` - контроллеры и маршруты API

Каждая ветка была смержена в `main` последовательно.

## 📄 Лицензия

MIT

---

**Автор:** Разработано для тестового задания ERP.AERO
