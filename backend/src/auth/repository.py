from sqlalchemy.orm import Session
from ..models.models import User
from ..core.security import get_password_hash, verify_password
from ..schemas.auth import UserCreate


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> User:
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def create_user(self, user: UserCreate) -> User:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate_user(self, username: str, password: str) -> User:
        user = self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user