from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import asyncio
from datetime import datetime
from app.database import get_db
from app.models import User, Tender, Comment
from app.middleware.auth import get_current_user
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

# Хранилище подписок (в памяти для MVP)
# В продакшене использовать Redis Pub/Sub
user_subscriptions: dict[int, list] = {}


@router.get("/events")
async def events_stream(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """SSE поток событий для уведомлений"""
    
    async def event_generator():
        # Инициализация подписки
        user_id = current_user.id
        if user_id not in user_subscriptions:
            user_subscriptions[user_id] = []
        
        last_check = datetime.utcnow()
        
        while True:
            # Проверка новых комментариев к тендерам пользователя
            new_comments = db.query(Comment).filter(
                Comment.tender_id.in_(
                    db.query(Tender.id).filter(Tender.organization_id == current_user.organization_id)
                ),
                Comment.user_id != current_user.id,
                Comment.created_at > last_check
            ).all()
            
            for comment in new_comments:
                yield {
                    "event": "new_comment",
                    "data": f'{{"tender_id": {comment.tender_id}, "user_id": {comment.user_id}, "created_at": "{comment.created_at.isoformat()}"}}'
                }
            
            # Проверка новых тендеров
            new_tenders = db.query(Tender).filter(
                Tender.organization_id == current_user.organization_id,
                Tender.created_by != current_user.id,
                Tender.created_at > last_check
            ).all()
            
            for tender in new_tenders:
                yield {
                    "event": "new_tender",
                    "data": f'{{"id": {tender.id}, "title": "{tender.title}", "created_by": {tender.created_by}}}'
                }
            
            last_check = datetime.utcnow()
            await asyncio.sleep(5)  # Опрос каждые 5 секунд
    
    return EventSourceResponse(event_generator())


@router.post("/notify")
async def notify_users(
    message: str,
    current_user: User = Depends(get_current_user)
):
    """Отправка уведомления всем пользователям организации (для тестирования)"""
    # В реальном приложении здесь была бы логика отправки через Redis Pub/Sub
    return {"message": "Уведомление отправлено", "organization_id": current_user.organization_id}
