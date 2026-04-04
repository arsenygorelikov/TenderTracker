.PHONY: help start stop restart logs clean build dev-db shell-backend shell-frontend

# Цвета для вывода
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Показать эту справку
	@echo "$(BLUE)B2B Tender Management System - доступные команды:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Быстрый старт:$(NC)"
	@echo "  make start          # Запустить всё"
	@echo "  make stop           # Остановить всё"
	@echo "  make logs           # Просмотр логов"

start: ## Запустить все сервисы (сборка + фон)
	@echo "$(GREEN)Запуск системы...$(NC)"
	docker-compose up --build -d
	@echo ""
	@echo "$(BLUE)Сервисы запущены!$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "$(YELLOW)Первый вход:$(NC)"
	@echo "  Email: admin@example.com"
	@echo "  Пароль: admin123"

stop: ## Остановить все сервисы
	@echo "$(YELLOW)Остановка сервисов...$(NC)"
	docker-compose down
	@echo "$(GREEN)Готово!$(NC)"

restart: ## Перезапустить все сервисы
	@echo "$(YELLOW)Перезапуск...$(NC)"
	docker-compose restart
	@echo "$(GREEN)Готово!$(NC)"

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи только backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи только frontend
	docker-compose logs -f frontend

logs-db: ## Показать логи только БД
	docker-compose logs -f db

clean: ## Полная очистка (контейнеры + тома + образы)
	@echo "$(YELLOW)Удаление всех контейнеров, томов и образов...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)Очистка завершена!$(NC)"

build: ## Пересобрать образы без запуска
	@echo "$(BLUE)Сборка образов...$(NC)"
	docker-compose build

dev-db: ## Подключиться к БД через psql
	@echo "$(GREEN)Подключение к базе данных...$(NC)"
	docker-compose exec db psql -U postgres -d tenders

shell-backend: ## Получить shell в контейнере backend
	@echo "$(GREEN)Подключение к backend контейнеру...$(NC)"
	docker-compose exec backend /bin/bash

shell-frontend: ## Получить shell в контейнере frontend
	@echo "$(GREEN)Подключение к frontend контейнеру...$(NC)"
	docker-compose exec frontend /bin/bash

status: ## Показать статус сервисов
	docker-compose ps

health: ## Проверить здоровье сервисов
	@echo "$(BLUE)Проверка здоровья...$(NC)"
	@echo -n "Backend:  "
	@curl -s http://localhost:8000/health > /dev/null && echo "$(GREEN)OK$(NC)" || echo "$(YELLOW)Недоступен$(NC)"
	@echo -n "Frontend: "
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)OK$(NC)" || echo "$(YELLOW)Недоступен$(NC)"
