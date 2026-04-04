from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth, tenders, events
from app.core.security import get_password_hash
from app.models import Organization, User

# Создание таблиц
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tender Management API",
    description="B2B система управления тендерами и закупками",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tenders.router, prefix="/api/tenders", tags=["tenders"])
app.include_router(events.router, prefix="/api", tags=["events"])


@app.on_event("startup")
async def startup_event():
    """Создание тестовых данных при старте"""
    from app.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Проверка наличия данных
        if db.query(Organization).count() == 0:
            # Создаём тестовую организацию
            org = Organization(name="Тестовая Организация", inn="7701234567")
            db.add(org)
            db.commit()
            db.refresh(org)
            
            # Создаём администратора
            admin = User(
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Администратор",
                role="ORG_ADMIN",
                organization_id=org.id
            )
            db.add(admin)
            
            # Создаём менеджера
            manager = User(
                email="manager@example.com",
                hashed_password=get_password_hash("manager123"),
                full_name="Менеджер Тендеров",
                role="TENDER_MANAGER",
                organization_id=org.id
            )
            db.add(manager)
            
            # Создаём наблюдателя
            viewer = User(
                email="viewer@example.com",
                hashed_password=get_password_hash("viewer123"),
                full_name="Наблюдатель",
                role="VIEWER",
                organization_id=org.id
            )
            db.add(viewer)
            
            db.commit()
            print("Тестовые данные созданы!")
            print("Доступные пользователи:")
            print("  admin@example.com / admin123 (ORG_ADMIN)")
            print("  manager@example.com / manager123 (TENDER_MANAGER)")
            print("  viewer@example.com / viewer123 (VIEWER)")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Tender Management API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
