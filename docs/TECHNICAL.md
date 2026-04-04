# B2B Tender Management System - Technical Documentation

## Архитектурные решения

### Почему выбран этот стек?

**Backend: FastAPI (Python)**
- Высокая производительность благодаря async/await
- Автоматическая генерация OpenAPI документации
- Строгая типизация через Pydantic
- Быстрая разработка и простота поддержки

**Frontend: React + TypeScript + Vite**
- Современный стандарт для SPA
- Отличная производительность с Vite
- Типобезопасность через TypeScript
- Богатая экосистема компонентов

**База данных: PostgreSQL**
- Надёжность и ACID-транзакции
- Поддержка JSON полей для гибкости
- Row-level security (можно добавить при росте)

**Realtime: Server-Sent Events (SSE)**
- Проще чем WebSocket для однонаправленных уведомлений
- Встроенная поддержка в браузере
- Автоматическое переподключение
- Достаточно для уведомлений о новых тендерах/комментариях

### Мультитенантность

**Подход:隔离 на уровне приложения (Logical Isolation)**

Каждая запись в БД имеет `organization_id`. Все запросы фильтруются через зависимости FastAPI:

```python
def get_current_user(...):
    user = db.query(User).filter(User.id == user_id).first()
    return user  # содержит organization_id

# В роутерах:
tenders = db.query(Tender).filter(
    Tender.organization_id == current_user.organization_id
).all()
```

**Преимущества:**
- Одна база данных, проще бэкапы и миграции
- Нет overhead на подключение к разным БД
- Легко масштабировать

**Риски и mitigation:**
- Риск утечки данных при ошибке в коде → код-ревью, тесты
- Можно добавить Row-Level Security в PostgreSQL для дополнительной защиты

### Модель данных

```
Organization (1) ──< User (N)
     │
     └──< Tender (N) ──< Comment (N)
              │
              ├──< TenderStage (N)
              └──< AuditLog (N)
```

**Ключевые поля тендера:**
- `tender_type`: 44-ФЗ, 223-ФЗ, Коммерческая
- `nmcc`: НМЦК (начальная максимальная цена контракта)
- `notification_number`: номер извещения
- `marketplace`: площадка размещения
- `status`: draft → planning → active → completed/cancelled

### API дизайн

**RESTful принципы:**
- `/api/tenders` - GET список, POST создание
- `/api/tenders/{id}` - GET детали, PUT обновление, DELETE удаление
- `/api/tenders/{id}/comments` - POST комментарий
- `/api/tenders/{id}/audit` - GET история изменений

**Аутентификация:**
- JWT access token (15 мин) + refresh token (7 дней)
- Token передаётся в заголовке `Authorization: Bearer <token>`

### Безопасность

1. **Изоляция организаций**: каждый запрос проверяет `organization_id`
2. **Ролевая модель**: middleware проверяет роль перед операциями
3. **Пароли**: bcrypt хеширование
4. **CORS**: ограничен доменом фронтенда
5. **SQL injection**: предотвращено через SQLAlchemy ORM

## Онбординг нового разработчика

### 1. Клонирование и запуск

```bash
git clone <repo-url>
cd tender-management
docker-compose up --build
```

Приложение доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 2. Тестовые учётные данные

| Email | Пароль | Роль |
|-------|--------|------|
| admin@example.com | admin123 | ORG_ADMIN |
| manager@example.com | manager123 | TENDER_MANAGER |
| viewer@example.com | viewer123 | VIEWER |

### 3. Структура кода

**Backend:**
```
backend/app/
├── main.py           # Точка входа, регистрация роутеров
├── config.py         # Настройки через pydantic-settings
├── database.py       # SQLAlchemy session
├── models/           # DB модели
├── schemas/          # Pydantic схемы (request/response)
├── api/              # API роутеры
├── middleware/       # Auth зависимости
├── core/             # Утилиты (JWT, hashing, enums)
└── services/         # Бизнес-логика (пока пусто в MVP)
```

**Frontend:**
```
frontend/src/
├── App.tsx           # Корневой компонент
├── main.tsx          # Точка входа
├── types/            # TypeScript типы
├── services/         # API клиент
├── hooks/            # Custom React hooks
└── pages/            # Страницы
```

### 4. Добавление новой фичи

**Пример: добавление поля к тендеру**

1. Обновить модель `backend/app/models/__init__.py`:
   ```python
   class Tender(Base):
       new_field = Column(String(255))
   ```

2. Обновить схему `backend/app/schemas/__init__.py`:
   ```python
   class TenderBase(BaseModel):
       new_field: Optional[str] = None
   ```

3. Создать миграцию Alembic:
   ```bash
   cd backend
   alembic revision --autogenerate -m "Add new_field to tender"
   alembic upgrade head
   ```

4. Обновить фронтенд формы и отображение

### 5. Запуск тестов (будущее)

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Развёртывание в продакшене

### Требования
- Docker + Docker Compose или Kubernetes
- HTTPS терминация (nginx/traefik)
- Переменные окружения для секретов

### Переменные окружения (production)

```bash
# Backend
SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:pass@host:5432/db
DEBUG=false

# Frontend
VITE_API_URL=https://api.yourdomain.com
```

### Рекомендации
1. Использовать managed PostgreSQL (AWS RDS, Yandex Cloud DB)
2. Настроить бэкапы БД
3. Использовать reverse proxy с HTTPS
4. Настроить мониторинг (Prometheus + Grafana)
5. Логирование в централизованную систему (ELK, Loki)
