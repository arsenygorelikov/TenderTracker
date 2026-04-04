from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.core.enums import UserRole, TenderType, TenderStatus


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    inn = Column(String(12), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    tenders = relationship("Tender", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    organization = relationship("Organization", back_populates="users")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    tender_type = Column(SQLEnum(TenderType), default=TenderType.COMMERCIAL)
    status = Column(SQLEnum(TenderStatus), default=TenderStatus.DRAFT)
    nmcc = Column(Numeric(15, 2))  # НМЦК - начальная максимальная цена контракта
    notification_number = Column(String(100))  # Номер извещения для 44-ФЗ/223-ФЗ
    marketplace = Column(String(255))  # Площадка размещения
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="tenders")
    creator = relationship("User", foreign_keys=[created_by])
    stages = relationship("TenderStage", back_populates="tender", cascade="all, delete-orphan", order_by="TenderStage.order")
    comments = relationship("Comment", back_populates="tender", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tender", cascade="all, delete-orphan")


class TenderStage(Base):
    __tablename__ = "tender_stages"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    tender = relationship("Tender", back_populates="stages")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_edited = Column(Boolean, default=False)

    tender = relationship("Tender", back_populates="comments")
    user = relationship("User", back_populates="comments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)  # create, update, delete, status_change
    field_name = Column(String(100))
    old_value = Column(Text)
    new_value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    tender = relationship("Tender", back_populates="audit_logs")
