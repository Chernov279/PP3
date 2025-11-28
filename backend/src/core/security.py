from datetime import datetime, timedelta
from http.client import HTTPException

from passlib.context import CryptContext
from ..core.config import settings

from passlib.context import CryptContext
from argon2 import PasswordHasher

ph = PasswordHasher()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


hashers = {
    "argon2": ph,
}


def hash_password(password: str, scrypt: str = "argon2") -> str:
    """
    Хэширование пароля с использованием выбранного алгоритма.
    Возвращает хэшированный пароль.
    """
    hasher = hashers.get(scrypt)
    if not hasher:
        raise HTTPException(msg="Wrong type of hash scrypt")
    return hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str, scrypt: str = "argon2") -> bool:
    """
    Проверка пароля с хэшированным значением.
    """
    hasher = hashers.get(scrypt)
    if not hasher:
        raise AppException(detail="Wrong type of hash scrypt")
    return ph.verify(hashed_password, plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except PyJWTError:
        return None