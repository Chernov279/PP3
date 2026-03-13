from datetime import datetime
from typing import Optional

from backend.src.config import settings
from backend.src.models.models import User
from backend.src.schemas.base import BaseSchema

TOKEN_TYPE: str = 'Bearer'

class UserBaseSchema(BaseSchema):
    __model__ = User


class AuthLoginIn(UserBaseSchema):
    email: str
    password: str


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

    class Config:
        from_attributes = True