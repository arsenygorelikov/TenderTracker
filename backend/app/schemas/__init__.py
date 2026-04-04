from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.core.enums import UserRole, TenderType, TenderStatus


# Organization schemas
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    inn: Optional[str] = Field(None, min_length=10, max_length=12)


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.VIEWER


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    organization_id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Tender schemas
class TenderStageBase(BaseModel):
    name: str
    description: Optional[str] = None
    order: int = 0


class TenderStageCreate(TenderStageBase):
    pass


class TenderStageResponse(TenderStageBase):
    id: int
    tender_id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TenderBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    tender_type: TenderType = TenderType.COMMERCIAL
    nmcc: Optional[float] = None
    notification_number: Optional[str] = None
    marketplace: Optional[str] = None


class TenderCreate(TenderBase):
    pass


class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tender_type: Optional[TenderType] = None
    status: Optional[TenderStatus] = None
    nmcc: Optional[float] = None
    notification_number: Optional[str] = None
    marketplace: Optional[str] = None


class TenderResponse(TenderBase):
    id: int
    status: TenderStatus
    organization_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TenderDetailResponse(TenderResponse):
    stages: list[TenderStageResponse] = []

    class Config:
        from_attributes = True


# Comment schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    id: int
    tender_id: int
    user_id: int
    user_email: str
    user_full_name: Optional[str] = None
    created_at: datetime
    is_edited: bool

    class Config:
        from_attributes = True


# Audit log schemas
class AuditLogResponse(BaseModel):
    id: int
    tender_id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
