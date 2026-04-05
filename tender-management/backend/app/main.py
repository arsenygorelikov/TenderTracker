from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from typing import Dict, List

from app.core.config import settings
from app.models.database import engine, Base
from app.api.v1.router import api_router


# Создание таблиц базы данных
Base.metadata.create_all(bind=engine)


# Менеджер WebSocket подключений
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)
    
    async def broadcast_to_tender(self, message: dict, tender_id: str):
        # Отправка сообщения всем подключенным пользователям
        # В реальной реализации нужно отслеживать подписки на тендеры
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                await connection.send_json(message)


manager = ConnectionManager()


app = FastAPI(
    title=settings.app_name,
    description="B2B система управления тендерами и закупками",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "Tender Management API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket endpoint для уведомлений в реальном времени"""
    from app.core.jwt import decode_token
    
    # Проверка токена
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return
    
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return
    
    # Подключение пользователя
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Получение сообщений от клиента (например, подписка на тендеры)
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Обработка команд подписки
            if message_data.get("type") == "subscribe":
                tender_id = message_data.get("tender_id")
                # Логика подписки на конкретный тендер
                pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {"status": "healthy"}
