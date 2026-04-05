from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Text, Float, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
import enum

from app.core.config import settings


# Создание движка базы данных
engine = create_engine(settings.database_url)

# Сессия базы данных
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


def generate_uuid() -> str:
    """Генерация UUID"""
    return str(uuid.uuid4())


# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class TenderStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventType(str, enum.Enum):
    COMMENT = "comment"
    STATUS_CHANGE = "status_change"
    NOTIFICATION = "notification"


# Models
class Tenant(Base):
    """Организация клиент"""
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    tenders = relationship("Tender", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """Пользователь системы"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    created_tenders = relationship("Tender", back_populates="creator", foreign_keys="Tender.created_by")
    events = relationship("TenderEvent", back_populates="user", cascade="all, delete-orphan")
    change_logs = relationship("TenderChangeLog", back_populates="user", cascade="all, delete-orphan")


class Tender(Base):
    """Тендер/закупка"""
    __tablename__ = "tenders"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(TenderStatus), default=TenderStatus.DRAFT)
    budget = Column(Float, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="tenders")
    creator = relationship("User", back_populates="created_tenders", foreign_keys=[created_by])
    events = relationship("TenderEvent", back_populates="tender", cascade="all, delete-orphan")
    change_logs = relationship("TenderChangeLog", back_populates="tender", cascade="all, delete-orphan")


class TenderEvent(Base):
    """Событие тендера (комментарии, уведомления)"""
    __tablename__ = "tender_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_type = Column(SQLEnum(EventType), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tender = relationship("Tender", back_populates="events")
    user = relationship("User", back_populates="events")


class TenderChangeLog(Base):
    """История изменений тендера"""
    __tablename__ = "tender_change_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tender_id = Column(String, ForeignKey("tenders.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text)  # JSON строка
    new_value = Column(Text)  # JSON строка
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tender = relationship("Tender", back_populates="change_logs")
    user = relationship("User", back_populates="change_logs")


def get_db():
    """Получение сессии базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
