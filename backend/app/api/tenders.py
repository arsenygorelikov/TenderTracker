from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Tender, AuditLog
from app.schemas import (
    TenderCreate, TenderUpdate, TenderResponse, TenderDetailResponse,
    CommentCreate, CommentResponse, TenderStageCreate, TenderStageResponse,
    AuditLogResponse
)
from app.middleware.auth import get_current_user, get_current_tender_manager_or_admin

router = APIRouter()


def log_audit(db: Session, tender_id: int, user_id: int, action: str, field_name: str = None, old_value: str = None, new_value: str = None):
    audit = AuditLog(
        tender_id=tender_id,
        user_id=user_id,
        action=action,
        field_name=field_name,
        old_value=str(old_value) if old_value else None,
        new_value=str(new_value) if new_value else None
    )
    db.add(audit)


@router.get("", response_model=List[TenderResponse])
def list_tenders(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Список тендеров организации пользователя"""
    tenders = db.query(Tender).filter(
        Tender.organization_id == current_user.organization_id
    ).offset(skip).limit(limit).all()
    return tenders


@router.post("", response_model=TenderResponse)
def create_tender(
    tender_data: TenderCreate,
    current_user: User = Depends(get_current_tender_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Создание нового тендера"""
    tender = Tender(
        **tender_data.model_dump(),
        organization_id=current_user.organization_id,
        created_by=current_user.id
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)
    
    # Аудит
    log_audit(db, tender.id, current_user.id, "create")
    db.commit()
    
    return tender


@router.get("/{tender_id}", response_model=TenderDetailResponse)
def get_tender(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение тендера по ID"""
    tender = db.query(Tender).filter(
        Tender.id == tender_id,
        Tender.organization_id == current_user.organization_id
    ).first()
    
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    return tender


@router.put("/{tender_id}", response_model=TenderResponse)
def update_tender(
    tender_id: int,
    tender_data: TenderUpdate,
    current_user: User = Depends(get_current_tender_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Обновление тендера"""
    tender = db.query(Tender).filter(
        Tender.id == tender_id,
        Tender.organization_id == current_user.organization_id
    ).first()
    
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    # Логирование изменений
    update_data = tender_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_val = getattr(tender, field)
        if old_val != value:
            log_audit(db, tender_id, current_user.id, "update", field, str(old_val), str(value))
    
    for field, value in update_data.items():
        setattr(tender, field, value)
    
    db.commit()
    db.refresh(tender)
    return tender


@router.delete("/{tender_id}")
def delete_tender(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление тендера (только ORG_ADMIN)"""
    if current_user.role != "ORG_ADMIN":
        raise HTTPException(status_code=403, detail="Требуется роль администратора")
    
    tender = db.query(Tender).filter(
        Tender.id == tender_id,
        Tender.organization_id == current_user.organization_id
    ).first()
    
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    log_audit(db, tender_id, current_user.id, "delete")
    db.delete(tender)
    db.commit()
    
    return {"message": "Тендер удалён"}


@router.post("/{tender_id}/stages", response_model=TenderStageResponse)
def add_stage(
    tender_id: int,
    stage_data: TenderStageCreate,
    current_user: User = Depends(get_current_tender_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Добавление этапа тендера"""
    tender = db.query(Tender).filter(
        Tender.id == tender_id,
        Tender.organization_id == current_user.organization_id
    ).first()
    
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    from app.models import TenderStage
    stage = TenderStage(**stage_data.model_dump(), tender_id=tender_id)
    db.add(stage)
    db.commit()
    db.refresh(stage)
    
    log_audit(db, tender_id, current_user.id, "stage_add", "stage", None, stage_data.name)
    db.commit()
    
    return stage


@router.post("/{tender_id}/comments", response_model=CommentResponse)
def add_comment(
    tender_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление комментария к тендеру"""
    tender = db.query(Tender).filter(
        Tender.id == tender_id,
        Tender.organization_id == current_user.organization_id
    ).first()
    
    if not tender:
        raise HTTPException(status_code=404, detail="Тендер не найден")
    
    from app.models import Comment
    comment = Comment(
        **comment_data.model_dump(),
        tender_id=tender_id,
        user_id=current_user.id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return comment


@router.get("/{tender_id}/audit", response_model=List[AuditLogResponse])
def get_audit_log(
    tender_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """История изменений тендера"""
    logs = db.query(AuditLog).filter(
        AuditLog.tender_id == tender_id
    ).order_by(AuditLog.created_at.desc()).all()
    
    return logs
