from typing import Optional

from fastapi import Depends, Body, Cookie, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from backend.src.api.auth.exceptions import TokenMissingException
from backend.src.api.auth.service import AuthService
from backend.src.api.auth.utils import get_sub_from_token
from backend.src.database.connection import get_db_session
# Для обязательной авторизации (выбрасывает 403, если токена нет)
security_required = HTTPBearer()

# Для опциональной (не выбрасывает ошибку при отсутствии токена)
security_optional = HTTPBearer(auto_error=False)

async def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
) -> AuthService:
    return AuthService(session)


async def get_refresh_token(
    refresh_token: Optional[str] = Body(None, embed=True),
    refresh_token_cookie: Optional[str] = Cookie(None, alias="refresh_token")
) -> str:
    token = refresh_token_cookie or refresh_token
    return token


def get_optional_token(access_token: str) -> Optional[str]:
    """
    Получает токен из заголовка Authorization.
    Если токена нет — просто возвращает None, без ошибки 401.
    """
    if access_token and access_token.startswith("Bearer "):
        token_str = access_token.split("Bearer ")[1]
        if token_str:
            return token_str
    return None


def get_token_sub_required(
    credentials: HTTPAuthorizationCredentials = Depends(security_required)
) -> int:
    """
    Получает значение sub - обычно user_id - из заголовка Authorization через токен.
    Если токена нет — возвращает ошибку.
    """
    token = credentials.credentials
    sub = get_sub_from_token(token, raise_exception=True)
    return sub


def get_token_sub_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)
) -> Optional[int]:
    if credentials is None:
        return None
    token = credentials.credentials
    return get_sub_from_token(token, raise_exception=False)