from typing import List, Any, Optional

from sqlalchemy import Column, Integer, String, DateTime, Text, Date, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

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


    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, index=True)
    original_title: Mapped[str] = mapped_column(String)  # Оригинальное название
    description: Mapped[str] = mapped_column(Text)
    trailer_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    release_date: Mapped[date] = mapped_column(Date)
    duration: Mapped[int] = mapped_column(Integer)  # в минутах
    budget: Mapped[int] = mapped_column(Integer)  # бюджет в долларах
    revenue: Mapped[int] = mapped_column(Integer)  # сборы в долларах

    # Рейтинги
    kp_rating: Mapped[float] = mapped_column(Float)  # КиноПоиск
    imdb_rating: Mapped[float] = mapped_column(Float)  # IMDB
    metacritic_rating: Mapped[float] = mapped_column(Float)  # Metacritic

    # Статистика
    vote_count: Mapped[int] = mapped_column(Integer)  # количество оценок
    popularity: Mapped[float] = mapped_column(Float)  # популярность (TMDB)

    # Технические характеристики
    language: Mapped[str] = mapped_column(String)
    country: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String)  # Released, Post Production, etc

    # Для рекомендаций
    keywords: Mapped[Optional[dict]] = mapped_column(JSON)  # ключевые слова фильма
    content_score: Mapped[float] = mapped_column(Float)  # вычисляемый score для контентной фильтрации

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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    birth_date: Mapped[date] = mapped_column(Date)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    country: Mapped[str] = mapped_column(String)
    biography: Mapped[str] = mapped_column(Text)

    # Для рекомендаций
    popularity: Mapped[float] = mapped_column(Float)
    average_rating: Mapped[float] = mapped_column(Float)  # средний рейтинг фильмов с участием


class MovieActor(DeclarativeBaseModel):
    __tablename__ = "movie_actors"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    character_name: Mapped[str] = mapped_column(String)  # имя персонажа
    is_lead_role: Mapped[bool] = mapped_column(Boolean, default=False)
    is_first_plan: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer)  # порядок в титрах

class Director(DeclarativeBaseModel):
    __tablename__ = "directors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    birth_date: Mapped[date] = mapped_column(Date)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    country: Mapped[str] = mapped_column(String)
    biography: Mapped[str] = mapped_column(Text)

    # Для рекомендаций
    style_tags: Mapped[Optional[dict]] = mapped_column(JSON)  # теги стиля режиссера
    average_rating: Mapped[float] = mapped_column(Float)


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


class Review(DeclarativeBaseModel):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    movie_id: Mapped[int] = mapped_column(Integer, index=True)
    rating: Mapped[float] = mapped_column(Float)  # 1-10
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    likes: Mapped[int] = mapped_column(Integer, default=0)

class WatchHistory(DeclarativeBaseModel):
    __tablename__ = "watch_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    movie_id: Mapped[int] = mapped_column(Integer, index=True)
    watched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    watch_duration: Mapped[int] = mapped_column(Integer)  # в минутах
    rating: Mapped[float] = mapped_column(Float)  # автоматическая оценка на основе просмотра


class ContentFeatures(DeclarativeBaseModel):
    __tablename__ = "content_features"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    genre_vector: Mapped[Optional[dict]] = mapped_column(JSON)  # вектор жанров
    actor_vector: Mapped[Optional[dict]] = mapped_column(JSON)  # вектор актеров
    director_vector: Mapped[Optional[dict]] = mapped_column(JSON)  # вектор режиссеров
    keyword_vector: Mapped[Optional[dict]] = mapped_column(JSON)  # вектор ключевых слов
    embedding: Mapped[Optional[dict]] = mapped_column(JSON)  # общий эмбеддинг для косинусного сходства


class UserPreferences(DeclarativeBaseModel):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    genre_weights: Mapped[Optional[dict]] = mapped_column(JSON)  # веса предпочтений по жанрам
    actor_weights: Mapped[Optional[dict]] = mapped_column(JSON)  # веса предпочтений по актерам
    director_weights: Mapped[Optional[dict]] = mapped_column(JSON)  # веса предпочтений по режиссерам
    rating_tendency: Mapped[float] = mapped_column(Float)  # склонность к высоким/низким рейтингам
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SimilarMovies(DeclarativeBaseModel):
    __tablename__ = "similar_movies"

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    similar_movies: Mapped[Optional[dict]] = mapped_column(JSON)  # {movie_id: similarity_score}
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

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