from datetime import timedelta
from .repository import UserRepository
from ..schemas.auth import UserCreate, UserLogin, Token
from ..core.security import create_access_token
from ..core.config import settings


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def register_user(self, user_data: UserCreate) -> Token:
        # Проверяем, существует ли пользователь
        if self.user_repository.get_user_by_username(user_data.username):
            raise ValueError("Username already registered")
        if self.user_repository.get_user_by_email(user_data.email):
            raise ValueError("Email already registered")

        # Создаем пользователя
        user = self.user_repository.create_user(user_data)

        # Создаем токен
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return Token(access_token=access_token, token_type="bearer")

    def login_user(self, login_data: UserLogin) -> Token:
        user = self.user_repository.authenticate_user(login_data.username, login_data.password)
        if not user:
            raise ValueError("Incorrect username or password")

        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        return Token(access_token=access_token, token_type="bearer")