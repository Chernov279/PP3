from datetime import datetime
from typing import List, Optional

from pydantic import EmailStr, field_validator

from backend.src.config import settings
from backend.src.models.models import User
from backend.src.schemas.base import BaseSchema

TOKEN_TYPE: str = 'Bearer'

class UserBaseSchema(BaseSchema):
    __model__ = User


class AuthLoginIn(UserBaseSchema):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors: List[str] = []

        # Проверка минимальной длины
        if len(v) < 8:
            errors.append("Пароль должен содержать минимум 8 символов")

        # Проверка наличия цифры
        if not any(char.isdigit() for char in v):
            errors.append("Пароль должен содержать хотя бы одну цифру")

        # Проверка наличия спецсимвола
        if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?" for char in v):
            errors.append("Пароль должен содержать хотя бы один специальный символ (!@#$%^&*...)")

        # Проверка наличия буквы верхнего регистра (рекомендация)
        if not any(char.isupper() for char in v):
            errors.append("Пароль должен содержать хотя бы одну заглавную букву")

        if errors:
            raise ValueError("; ".join(errors))

        return v


class AuthRegisterIn(AuthLoginIn):
    name: str


class AuthRegisterInternal(UserBaseSchema):
    email: str
    name: str
    hashed_password: str


class RefreshTokenInternal(BaseSchema):
    user_id: int
    token_hash: str
    expires_at: datetime
    device_fingerprint: str | None = None
    revoked_at: datetime | None = None


class TokensOut(BaseSchema):
    user_id: Optional[int] = None
    access_token: str
    refresh_token: str
    token_type: str = TOKEN_TYPE
    access_expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES


class AccessTokenOut(BaseSchema):
    access_token: str
    token_type: str = TOKEN_TYPE


class LogoutOut(BaseSchema):
    message: str = "Successfully logged out from device"
    device_logged_out: bool
    timestamp: str

class UserUpdateIn(UserBaseSchema):
    name : str
    email : str


class UserOut(UserBaseSchema):
    id: int
    email: str
    name: str
    is_kinopoisk_synchronized: bool
    created_at: datetime

    class Config:
        from_attributes = True