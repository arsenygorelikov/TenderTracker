from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Organization
from app.schemas import UserCreate, UserLogin, Token, UserResponse, OrganizationCreate, OrganizationResponse
from app.core.security import verify_password, get_password_hash
from app.core.jwt import create_access_token, create_refresh_token
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/register/organization", response_model=OrganizationResponse)
def register_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Регистрация новой организации"""
    existing = db.query(Organization).filter(Organization.inn == org_data.inn).first()
    if existing:
        raise HTTPException(status_code=400, detail="Организация с таким ИНН уже существует")
    
    organization = Organization(**org_data.model_dump())
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


@router.post("/register/user", response_model=UserResponse)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Регистрация пользователя в организации (только для ORG_ADMIN)"""
    # Для простоты MVP - первый пользователь становится админом
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Определяем организацию - если это первый пользователь, создаём демо-организацию
    org = db.query(Organization).first()
    if not org:
        raise HTTPException(status_code=400, detail="Сначала зарегистрируйте организацию")
    
    # Первый пользователь организации автоматически становится админом
    is_first_in_org = db.query(User).filter(User.organization_id == org.id).count() == 0
    role = "ORG_ADMIN" if is_first_in_org else user_data.role
    
    user = User(
        **user_data.model_dump(exclude={"password"}),
        hashed_password=get_password_hash(user_data.password),
        role=role,
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя"""
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Пользователь деактивирован")
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Получение текущего пользователя"""
    return current_user
