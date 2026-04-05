from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.models.database import Tenant, User, Tender, TenderEvent, TenderChangeLog, UserRole, TenderStatus, EventType
from app.core.security import get_password_hash


class TenantService:
    """Сервис для работы с организациями"""
    
    @staticmethod
    def create_tenant(db: Session, name: str) -> Tenant:
        tenant = Tenant(name=name)
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        return tenant
    
    @staticmethod
    def get_tenant_by_id(db: Session, tenant_id: str) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    @staticmethod
    def get_all_tenants(db: Session) -> List[Tenant]:
        return db.query(Tenant).all()


class UserService:
    """Сервис для работы с пользователями"""
    
    @staticmethod
    def create_user(
        db: Session,
        tenant_id: str,
        email: str,
        password: str,
        role: UserRole = UserRole.VIEWER
    ) -> User:
        user = User(
            tenant_id=tenant_id,
            email=email,
            password_hash=get_password_hash(password),
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_users_by_tenant(db: Session, tenant_id: str) -> List[User]:
        return db.query(User).filter(User.tenant_id == tenant_id).all()
    
    @staticmethod
    def update_user(
        db: Session,
        user: User,
        email: Optional[str] = None,
        role: Optional[UserRole] = None
    ) -> User:
        if email:
            user.email = email
        if role:
            user.role = role
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user: User) -> None:
        db.delete(user)
        db.commit()
    
    @staticmethod
    def verify_user_password(user: User, password: str) -> bool:
        from app.core.security import verify_password
        return verify_password(password, user.password_hash)


class TenderService:
    """Сервис для работы с тендерами"""
    
    @staticmethod
    def create_tender(
        db: Session,
        tenant_id: str,
        created_by: str,
        title: str,
        description: Optional[str] = None,
        budget: Optional[float] = None,
        status: TenderStatus = TenderStatus.DRAFT
    ) -> Tender:
        tender = Tender(
            tenant_id=tenant_id,
            created_by=created_by,
            title=title,
            description=description,
            budget=budget,
            status=status
        )
        db.add(tender)
        db.commit()
        db.refresh(tender)
        return tender
    
    @staticmethod
    def get_tender_by_id(db: Session, tender_id: str, tenant_id: str) -> Optional[Tender]:
        return db.query(Tender).filter(
            Tender.id == tender_id,
            Tender.tenant_id == tenant_id
        ).first()
    
    @staticmethod
    def get_tenders_by_tenant(db: Session, tenant_id: str) -> List[Tender]:
        return db.query(Tender).filter(
            Tender.tenant_id == tenant_id
        ).order_by(Tender.created_at.desc()).all()
    
    @staticmethod
    def update_tender(
        db: Session,
        tender: Tender,
        user: User,
        title: Optional[str] = None,
        description: Optional[str] = None,
        budget: Optional[float] = None,
        status: Optional[TenderStatus] = None
    ) -> Tender:
        changes = []
        
        if title and title != tender.title:
            changes.append(("title", tender.title, title))
            tender.title = title
        
        if description is not None and description != tender.description:
            changes.append(("description", tender.description, description))
            tender.description = description
        
        if budget is not None and budget != tender.budget:
            changes.append(("budget", str(tender.budget), str(budget)))
            tender.budget = budget
        
        if status and status != tender.status:
            changes.append(("status", tender.status.value, status.value))
            tender.status = status
        
        # Log changes
        for field_name, old_value, new_value in changes:
            change_log = TenderChangeLog(
                tender_id=tender.id,
                user_id=user.id,
                field_name=field_name,
                old_value=json.dumps(old_value) if old_value else None,
                new_value=json.dumps(new_value) if new_value else None
            )
            db.add(change_log)
        
        db.commit()
        db.refresh(tender)
        return tender
    
    @staticmethod
    def delete_tender(db: Session, tender: Tender) -> None:
        db.delete(tender)
        db.commit()


class TenderEventService:
    """Сервис для работы с событиями тендера"""
    
    @staticmethod
    def create_event(
        db: Session,
        tender_id: str,
        user_id: str,
        event_type: EventType,
        content: str
    ) -> TenderEvent:
        event = TenderEvent(
            tender_id=tender_id,
            user_id=user_id,
            event_type=event_type,
            content=content
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_events_by_tender(db: Session, tender_id: str) -> List[TenderEvent]:
        return db.query(TenderEvent).filter(
            TenderEvent.tender_id == tender_id
        ).order_by(TenderEvent.created_at.asc()).all()
    
    @staticmethod
    def get_change_log_by_tender(db: Session, tender_id: str) -> List[TenderChangeLog]:
        return db.query(TenderChangeLog).filter(
            TenderChangeLog.tender_id == tender_id
        ).order_by(TenderChangeLog.created_at.asc()).all()
