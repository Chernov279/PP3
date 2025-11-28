from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Используем declarative_base() вместо импорта Base
Base = declarative_base()

engine = create_engine(
    settings.full_database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.full_database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()