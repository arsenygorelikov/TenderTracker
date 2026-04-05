from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.models.database import get_db, User, UserRole, Tenant
from app.schemas.schemas import UserLogin, Token, UserCreate, UserResponse
from app.services.services import UserService, TenantService
from app.core.jwt import create_access_token, create_refresh_token
from app.core.security import verify_password
from app.middleware.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Аутентификация пользователя и получение токенов"""
    user = UserService.get_user_by_email(db, email=user_data.email)
    
    if not user or not UserService.verify_user_password(user, user_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создание токенов
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={
            "sub": user.id,
            "tenant_id": user.tenant_id,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        data={"sub": user.id, "tenant_id": user.tenant_id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Получение информации о текущем пользователе"""
    return current_user


@router.post("/register", response_model=UserResponse)
async def register_first_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Регистрация первого пользователя организации (для демонстрации)"""
    # Проверяем есть ли уже пользователи с таким email
    existing_user = UserService.get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Для демо создаем tenant если это первый пользователь
    # В реальном приложении tenant создается отдельно
    tenant = TenantService.create_tenant(db, name="Demo Organization")
    
    # Создаем пользователя с ролью admin
    user = UserService.create_user(
        db=db,
        tenant_id=tenant.id,
        email=user_data.email,
        password=user_data.password,
        role=UserRole.ADMIN
    )
    
    return user
