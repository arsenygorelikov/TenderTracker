from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.models.database import get_db, User, Tender, UserRole
from app.schemas.schemas import (
    TenderCreate, TenderUpdate, TenderResponse,
    TenderEventCreate, TenderEventResponse,
    TenderChangeLogResponse
)
from app.services.services import TenderService, TenderEventService
from app.middleware.auth import get_current_user, get_current_manager_or_admin


router = APIRouter(prefix="/tenders", tags=["Tenders"])


@router.get("", response_model=List[TenderResponse])
async def get_tenders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение списка тендеров организации"""
    return TenderService.get_tenders_by_tenant(db, tenant_id=current_user.tenant_id)


@router.post("", response_model=TenderResponse)
async def create_tender(
    tender_data: TenderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin)
):
    """Создание нового тендера"""
    tender = TenderService.create_tender(
        db=db,
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        title=tender_data.title,
        description=tender_data.description,
        budget=tender_data.budget,
        status=tender_data.status
    )
    
    # Создаем событие о создании тендера
    TenderEventService.create_event(
        db=db,
        tender_id=tender.id,
        user_id=current_user.id,
        event_type="notification",
        content=f"Тендер создан пользователем {current_user.email}"
    )
    
    return tender


@router.get("/{tender_id}", response_model=TenderResponse)
async def get_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение деталей тендера"""
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    return tender


@router.put("/{tender_id}", response_model=TenderResponse)
async def update_tender(
    tender_id: str,
    tender_data: TenderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin)
):
    """Обновление тендера"""
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    # Проверка прав на редактирование
    if current_user.role == UserRole.MANAGER and tender.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет прав на редактирование этого тендера"
        )
    
    updated_tender = TenderService.update_tender(
        db=db,
        tender=tender,
        user=current_user,
        title=tender_data.title,
        description=tender_data.description,
        budget=tender_data.budget,
        status=tender_data.status
    )
    
    return updated_tender


@router.delete("/{tender_id}")
async def delete_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаление тендера (только admin)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администратор может удалять тендеры"
        )
    
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    TenderService.delete_tender(db, tender)
    return {"message": "Тендер успешно удален"}


@router.get("/{tender_id}/events", response_model=List[TenderEventResponse])
async def get_tender_events(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение событий тендера"""
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    return TenderEventService.get_events_by_tender(db, tender_id=tender_id)


@router.post("/{tender_id}/events", response_model=TenderEventResponse)
async def create_tender_event(
    tender_id: str,
    event_data: TenderEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager_or_admin)
):
    """Добавление события/комментария к тендеру"""
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    event = TenderEventService.create_event(
        db=db,
        tender_id=tender_id,
        user_id=current_user.id,
        event_type=event_data.event_type,
        content=event_data.content
    )
    
    # TODO: Отправить WebSocket уведомление
    
    return event


@router.get("/{tender_id}/change-log", response_model=List[TenderChangeLogResponse])
async def get_tender_change_log(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение истории изменений тендера"""
    tender = TenderService.get_tender_by_id(db, tender_id=tender_id, tenant_id=current_user.tenant_id)
    
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Тендер не найден"
        )
    
    return TenderEventService.get_change_log_by_tender(db, tender_id=tender_id)
