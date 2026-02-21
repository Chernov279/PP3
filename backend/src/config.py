from pathlib import Path
from typing import List
from pydantic import computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ============================================
    # Проект
    # ============================================
    PROJECT_NAME: str = "PP3"
    DEBUG: bool = False
    VERSION: str = "1.0"
    CORS_ALLOWED_ORIGINS: List[str] = ["*"]
    API_KEY: str = ""

    # ============================================
    # База данных
    # ============================================
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_PORT: int = 5432
    POSTGRES_ECHO_LOG: bool = False


    # ============================================
    # JWT
    # ============================================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ============================================
    # Computed fields (строятся автоматически)
    # ============================================
    @computed_field
    @property
    def POSTGRES_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def POSTGRES_URL_SYNC(self) -> str:
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY должен быть не менее 32 символов")
        return v
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent.parent / ".env"),
        extra="ignore",
        env_file_encoding="utf-8",
    )
    
settings = Settings() # type: ignore