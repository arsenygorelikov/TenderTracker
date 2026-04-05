# Техническая документация

## Архитектурные решения

### Общая архитектура

Приложение построено по архитектуре модульного монолита с четким разделением ответственности между компонентами:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│    Backend   │────▶│  PostgreSQL │
│   (React)   │◀────│   (FastAPI)  │◀────│             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  WebSocket   │
                    │  Server      │
                    └──────────────┘
```

### Мультитенантность

Используется подход **tenant isolation через tenant_id**:

1. **Изоляция на уровне приложения**: Каждая таблица содержит поле `tenant_id`
2. **Проверка в middleware**: Каждый запрос проверяет принадлежность к tenant пользователя
3. **UUID идентификаторы**: Все основные сущности используют UUID для безопасности
4. **Row-level security**: Дополнительная защита на уровне базы данных

Преимущества:
- Простота реализации и поддержки
- Эффективное использование ресурсов БД
- Легкость масштабирования
- Возможность миграции к отдельным БД на tenant при необходимости

### Модель данных

#### ERD Диаграмма

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Tenant     │       │    User      │       │    Tender    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (UUID)    │◀──────│ tenant_id    │       │ tenant_id    │
│ name         │       │ id (UUID)    │◀──────│ id (UUID)    │
│ created_at   │       │ email        │       │ title        │
│ updated_at   │       │ password_hash│       │ description  │
└──────────────┘       │ role         │       │ status       │
                       │ created_at   │       │ budget       │
                       └──────────────┘       │ created_by   │
                                              │ created_at   │
                                              │ updated_at   │
                                              └──────────────┘
                                                     │
                       ┌──────────────┐              │
                       │ TenderEvent  │◀─────────────┘
                       ├──────────────┤
                       │ id (UUID)    │
                       │ tender_id    │
                       │ user_id      │
                       │ event_type   │
                       │ content      │
                       │ created_at   │
                       └──────────────┘
                              ▲
                              │
                       ┌──────────────┐
                       │TenderChangeLog│
                       ├──────────────┤
                       │ id (UUID)    │
                       │ tender_id    │
                       │ user_id      │
                       │ field_name   │
                       │ old_value    │
                       │ new_value    │
                       │ created_at   │
                       └──────────────┘
```

#### Описание таблиц

**Tenant** - Организация клиент
- `id`: UUID, первичный ключ
- `name`: Название организации
- `created_at`: Дата создания
- `updated_at`: Дата последнего обновления

**User** - Пользователь системы
- `id`: UUID, первичный ключ
- `tenant_id`: UUID, foreign key на Tenant
- `email`: Email для входа (уникальный в рамках tenant)
- `password_hash`: Хеш пароля
- `role`: Роль пользователя (admin/manager/viewer)
- `created_at`: Дата создания
- `updated_at`: Дата последнего обновления

**Tender** - Тендер/закупка
- `id`: UUID, первичный ключ
- `tenant_id`: UUID, foreign key на Tenant
- `title`: Название тендера
- `description`: Описание
- `status`: Статус (draft/published/in_progress/completed/cancelled)
- `budget`: Бюджет (опционально)
- `created_by`: UUID, foreign key на User
- `created_at`: Дата создания
- `updated_at`: Дата последнего обновления

**TenderEvent** - Событие тендера (комментарии, уведомления)
- `id`: UUID, первичный ключ
- `tender_id`: UUID, foreign key на Tender
- `user_id`: UUID, foreign key на User
- `event_type`: Тип события (comment/status_change/notification)
- `content`: Текст события
- `created_at`: Дата создания

**TenderChangeLog** - История изменений
- `id`: UUID, первичный ключ
- `tender_id`: UUID, foreign key на Tender
- `user_id`: UUID, foreign key на User
- `field_name`: Название измененного поля
- `old_value`: Старое значение (JSON)
- `new_value`: Новое значение (JSON)
- `created_at`: Дата изменения

### Ролевая модель и матрица прав

#### Роли

1. **admin** - Администратор организации
   - Полный доступ ко всем функциям
   - Управление пользователями
   - Настройка организации

2. **manager** - Менеджер тендеров
   - Создание и редактирование тендеров
   - Добавление комментариев
   - Просмотр всех тендеров организации

3. **viewer** - Наблюдатель
   - Только просмотр тендеров
   - Чтение комментариев
   - Без права внесения изменений

#### Матрица прав доступа

| Операция | admin | manager | viewer |
|----------|-------|---------|--------|
| **Тендеры** | | | |
| Создание | ✅ | ✅ | ❌ |
| Просмотр своих | ✅ | ✅ | ✅ |
| Просмотр чужих | ✅ | ✅ | ✅ |
| Редактирование своих | ✅ | ✅ | ❌ |
| Редактирование чужих | ✅ | ❌ | ❌ |
| Удаление своих | ✅ | ❌ | ❌ |
| **События** | | | |
| Добавление комментариев | ✅ | ✅ | ❌ |
| Просмотр событий | ✅ | ✅ | ✅ |
| **Пользователи** | | | |
| Просмотр списка | ✅ | ❌ | ❌ |
| Создание пользователя | ✅ | ❌ | ❌ |
| Редактирование роли | ✅ | ❌ | ❌ |
| Удаление пользователя | ✅ | ❌ | ❌ |

### API Design

#### REST API принципы

- Resource-oriented дизайн
- Использование HTTP методов по назначению
- Stateless аутентификация через JWT
- Версионирование API через URL (`/api/v1/`)
- JSON формат обмена данными

#### Основные эндпоинты

**Аутентификация**
```
POST   /api/v1/auth/login          # Вход пользователя
POST   /api/v1/auth/logout         # Выход
GET    /api/v1/auth/me             # Текущий пользователь
POST   /api/v1/auth/refresh        # Обновление токена
```

**Тендеры**
```
GET    /api/v1/tenders             # Список тендеров
POST   /api/v1/tenders             # Создание тендера
GET    /api/v1/tenders/{id}        # Детали тендера
PUT    /api/v1/tenders/{id}        # Обновление тендера
DELETE /api/v1/tenders/{id}        # Удаление тендера
```

**События тендера**
```
GET    /api/v1/tenders/{id}/events           # Список событий
POST   /api/v1/tenders/{id}/events           # Добавление события
GET    /api/v1/tenders/{id}/change-log       # История изменений
```

**Пользователи** (только admin)
```
GET    /api/v1/users                 # Список пользователей
POST   /api/v1/users                 # Создание пользователя
GET    /api/v1/users/{id}            # Детали пользователя
PUT    /api/v1/users/{id}            # Обновление пользователя
DELETE /api/v1/users/{id}            # Удаление пользователя
```

**WebSocket**
```
WS     /ws/events                    # Подписка на уведомления
```

### Безопасность

#### Аутентификация

- **JWT токены**: Access token (1 час) + Refresh token (7 дней)
- **Хеширование паролей**: bcrypt с cost factor 12
- **HTTPS**: Обязательно в продакшене
- **CORS**: Строгая настройка разрешенных источников

#### Авторизация

- **Middleware проверка**: Каждый запрос проверяет токен и права
- **Tenant isolation**: Проверка принадлежности к tenant на каждом уровне
- **Role-based access**: Проверка прав для каждой операции

#### Защита данных

- **SQL injection prevention**: SQLAlchemy ORM с параметризованными запросами
- **XSS protection**: Санитизация входных данных на frontend и backend
- **CSRF protection**: Token-based защита для state-changing операций
- **Rate limiting**: Ограничение частоты запросов

### Real-time уведомления

#### WebSocket архитектура

```
Client ──▶ WebSocket Connection ──▶ Connection Manager ──▶ Broadcast
                                                         ──▶ Targeted Send
```

#### Типы уведомлений

1. **Новый комментарий** в тендере
2. **Изменение статуса** тендера
3. **Упоминание пользователя** в комментарии
4. **Назначение ответственным** за тендер

#### Формат сообщений

```json
{
  "type": "tender_event",
  "data": {
    "tender_id": "uuid",
    "event_type": "comment",
    "user_id": "uuid",
    "content": "Текст комментария",
    "timestamp": "ISO8601"
  }
}
```

### Конфигурация окружения

#### Переменные окружения

**Backend (.env)**
```bash
DATABASE_URL=postgresql://user:password@db:5432/tender_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

## Инфраструктура

### Docker конфигурация

#### Сервисы

1. **backend**: FastAPI приложение
2. **frontend**: React приложение с Vite
3. **db**: PostgreSQL база данных
4. **nginx**: Reverse proxy (в продакшене)

#### Порты

- Frontend: 3000
- Backend API: 8000
- PostgreSQL: 5432

### Масштабирование

#### Горизонтальное масштабирование

- Backend: Несколько инстансов за load balancer
- Frontend: CDN для статических файлов
- Database: Read replicas для масштабирования чтения

#### Вертикальное масштабирование

- Увеличение ресурсов контейнеров
- Оптимизация запросов к БД
- Кэширование часто используемых данных

## Мониторинг и логирование

### Логирование

- Structured logging в JSON формате
- Уровни логирования: DEBUG, INFO, WARNING, ERROR
- Логирование всех критических операций
- Audit log для изменений данных

### Мониторинг

- Health check эндпоинты
- Метрики производительности API
- Мониторинг подключений WebSocket
- Отслеживание ошибок в реальном времени

## Тестирование

### Стратегия тестирования

1. **Unit тесты**: Покрытие бизнес логики (>80%)
2. **Integration тесты**: Тестирование API эндпоинтов
3. **E2E тесты**: Критические пользовательские сценарии
4. **Load тесты**: Проверка производительности под нагрузкой

### Инструменты

- Backend: pytest, pytest-asyncio, httpx
- Frontend: Jest, React Testing Library
- E2E: Playwright или Cypress

## Развертывание

### Development

```bash
docker-compose up --build
```

### Production

1. Настройка HTTPS сертификатов
2. Конфигурация переменных окружения
3. Настройка backup стратегии для БД
4. Мониторинг и алертинг
5. Load balancing и auto-scaling

### Backup стратегия

- Ежедневные бэкапы базы данных
- Хранение бэкапов в течение 30 дней
- Тестирование восстановления регулярно

## Производительность

### Оптимизации

- Индексация часто используемых полей
- Пагинация списков
- Кэширование справочников
- Lazy loading связанных данных
- WebSocket connection pooling

### Целевые метрики

- API response time: <200ms (p95)
- WebSocket latency: <50ms
- Page load time: <2s
- Uptime: 99.9%
