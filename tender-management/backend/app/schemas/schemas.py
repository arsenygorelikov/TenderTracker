from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    VIEWER = "viewer"


class TenderStatusEnum(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EventTypeEnum(str, Enum):
    COMMENT = "comment"
    STATUS_CHANGE = "status_change"
    NOTIFICATION = "notification"


# Tenant schemas
class TenantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class TenantCreate(TenantBase):
    pass


class TenantResponse(TenantBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRoleEnum = UserRoleEnum.VIEWER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRoleEnum] = None


class UserResponse(UserBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    role: Optional[str] = None


# Tender schemas
class TenderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    budget: Optional[float] = None
    status: TenderStatusEnum = TenderStatusEnum.DRAFT


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[TenderStatusEnum] = None


class TenderResponse(TenderBase):
    id: str
    tenant_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Event schemas
class TenderEventBase(BaseModel):
    event_type: EventTypeEnum
    content: str = Field(..., min_length=1)


class TenderEventCreate(TenderEventBase):
    pass


class TenderEventResponse(TenderEventBase):
    id: str
    tender_id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ChangeLog schemas
class TenderChangeLogResponse(BaseModel):
    id: str
    tender_id: str
    user_id: str
    field_name: str
    old_value: Optional[str]
    new_value: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
