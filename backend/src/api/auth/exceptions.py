from typing import Optional

from backend.src.exceptions import AppException
class InvalidEmailException(AppException):
    """Исключение для невалидной электронной почты."""
    def __init__(self):
        super().__init__(status_code=400, detail="Invalid email address")


class InvalidCredentialsException(AppException):
    """Исключение для неверной пары логин/пароль."""
    def __init__(self):
        super().__init__(status_code=401, detail="Invalid email or password")


class EmailAlreadyExistsException(AppException):
    """Исключение для уже зарегистрированного email."""
    def __init__(self):
        super().__init__(status_code=409, detail="User with this email already exists")

class NameAlreadyExistsException(AppException):
    """Исключение для уже зарегистрированного name."""
    def __init__(self):
        super().__init__(status_code=409, detail="User with this name already exists")

class InvalidUsernameException(AppException):
    """Исключение для невалидного имени пользователя."""
    def __init__(self, detail: str = "Invalid username format"):
        super().__init__(status_code=400, detail=detail)


class InvalidPasswordException(AppException):
    """Исключение для слабого пароля."""
    def __init__(self, detail: str = "Password does not meet security requirements"):
        super().__init__(status_code=400, detail=detail)


class InvalidTokenUserException(AppException):
    def __init__(self, user_id: Optional[int] = None):
        detail = f"User with ID {user_id} from token does not exist or token is invalid." \
            if user_id is not None else\
            "User from token does not exist or token is invalid"
        super().__init__(status_code=401, detail=detail)


class TokenMissingException(AppException):
    def __init__(self, token_type: Optional[str] = None):
        detail = f"{token_type} is missing"\
            if token_type is not None else \
            "Token is missing"
        super().__init__(status_code=401, detail=detail)


class InvalidTokenException(AppException):
    """Исключение при невалидном токене"""
    def __init__(self, detail: str = "Invalid token"):
        super().__init__(status_code=401, detail=detail)


class TokenRevokedException(AppException):
    """Исключение при отозванном токене"""
    def __init__(self, detail: str = "Token has been revoked"):
        super().__init__(status_code=403, detail=detail)


class TokenExpiredException(AppException):
    """Исключение при истекшем токене"""
    def __init__(self, detail: str = "Token has expired"):
        super().__init__(status_code=401, detail=detail)

