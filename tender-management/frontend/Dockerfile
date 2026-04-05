FROM node:18-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Экспортируем порт
EXPOSE 3000

# Запуск приложения
CMD ["npm", "run", "dev"]
