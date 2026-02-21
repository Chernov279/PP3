from typing import List, Any, Optional

from sqlalchemy import Column, Integer, String, DateTime, Text, Date, JSON, Float, Boolean, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from datetime import datetime, timezone, date


class DeclarativeBaseModel(DeclarativeBase):
    """Базовая модель в базе данных с общими методами."""
    __abstract__ = True

    @classmethod
    def get_pk_columns_names(cls) -> List[str]:
        """Получает имена всех первичных ключей модели."""
        return [key.name for key in cls.__mapper__.primary_key]

    @classmethod
    def get_pk_columns(cls) -> List[Any]:
        """
        Получает объекты колонок, являющихся первичными ключами модели.
        Обычно используется для выбора конкретных колонок в базе данных через model_columns
        User.get_pk_columns() -> [User.id,]
        """
        pk_column_names = [col.name for col in cls.__mapper__.primary_key]
        return [getattr(cls, column_name) for column_name in pk_column_names]

    @classmethod
    def get_columns_by_names(cls, *column_names) -> List[Any]:
        """Получает объекты колонок по их именам.
        Обычно используется для выбора конкретных колонок в базе данных через model_columns
        User.get_columns_by_names("name", "surname", "email") -> [User.name, User.surname, User.email]
        """
        return [getattr(cls, column_name) for column_name in column_names]


class Profile(DeclarativeBaseModel):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)


class Movie(DeclarativeBaseModel):
    __tablename__ = "movies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(String, index=True)
    original_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    trailer_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    release_date: Mapped[date] = mapped_column(Date, nullable=True)

    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    budget: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    revenue: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # рейтинги — ВСЕ nullable
    kp_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    imdb_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    metacritic_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    poster_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    vote_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    popularity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    language: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    keywords: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    content_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # watch_history = relationship("WatchHistory", back_populates="movie")

class Genre(DeclarativeBaseModel):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    description: Mapped[str] = mapped_column(String)


# Association table
class MovieGenre(DeclarativeBaseModel):
    __tablename__ = "movie_genres"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    genre_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class Actor(DeclarativeBaseModel):
    __tablename__ = "actors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    biography: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    popularity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

class MovieActor(DeclarativeBaseModel):
    __tablename__ = "movie_actors"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    character_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    is_lead_role: Mapped[bool] = mapped_column(Boolean, default=False)
    is_first_plan: Mapped[bool] = mapped_column(Boolean, default=False)

    order: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

class Director(DeclarativeBaseModel):
    __tablename__ = "directors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    biography: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    style_tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)


class MovieDirector(DeclarativeBaseModel):
    __tablename__ = "movie_directors"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    director_id: Mapped[int] = mapped_column(Integer, primary_key=True)


class User(DeclarativeBaseModel):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Предпочтения для рекомендаций
    favorite_genres: Mapped[Optional[dict]] = mapped_column(JSON)
    favorite_actors: Mapped[Optional[dict]] = mapped_column(JSON)
    favorite_directors: Mapped[Optional[dict]] = mapped_column(JSON)
    preferred_languages: Mapped[Optional[dict]] = mapped_column(JSON)

    # watch_history = relationship(
    #     "WatchHistory",
    #     back_populates="user",
    #     cascade="all, delete-orphan"  # при удалении пользователя удалится его история
    # )


class Review(DeclarativeBaseModel):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(Integer, index=True)
    movie_id: Mapped[int] = mapped_column(Integer, index=True)

    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 1–10, CHECK на уровне БД
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    likes: Mapped[int] = mapped_column(Integer, default=0)

class WatchHistory(DeclarativeBaseModel):
    __tablename__ = "watch_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(Integer, index=True)
    movie_id: Mapped[int] = mapped_column(Integer, index=True)

    watched_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    watch_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # user = relationship("User", back_populates="watch_history")

    # # Связь с фильмом
    # movie = relationship("Movie", back_populates="watch_history")

class ContentFeatures(DeclarativeBaseModel):
    __tablename__ = "content_features"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    genre_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    actor_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    director_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    keyword_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    embedding: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

class UserPreferences(DeclarativeBaseModel):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    genre_weights: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    actor_weights: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    director_weights: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    rating_tendency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

class SimilarMovies(DeclarativeBaseModel):
    __tablename__ = "similar_movies"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    similar_movies: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
class RefreshToken(DeclarativeBaseModel):
    """
    Модель refresh-токена (серверное состояние сессии).

    Один refresh-токен = одна строка в таблице.
    Используется для:
    - обновления access-токена,
    - logout с одного устройства,
    - logout со всех устройств пользователя.

    Атрибуты:
        id (int): Surrogate PK. Используется только БД, не участвует в бизнес-логике.
        user_id (int): ID пользователя.
        token_hash (str): SHA-256 хэш refresh-токена. Уникален.
        device_fingerprint (str | None): Опциональная информация об устройстве.
        expires_at (datetime): Время истечения refresh-токена.
        revoked_at (datetime | None): Время отзыва токена. NULL = токен активен.
        created_at (datetime): Время создания токена.
        updated_at (datetime | None): Время последнего обновления записи.

        user (User): Пользователь, которому принадлежит токен.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
    )

    device_fingerprint: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # -------- Lifecycle --------
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    @property
    def is_active(self) -> bool:
        """
        Возвращает True, если refresh-токен:
        - не отозван
        - не истёк
        """
        now = datetime.now(timezone.utc)
        return self.revoked_at is None and self.expires_at > now