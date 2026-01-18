from typing import List, Any, Optional

from sqlalchemy import Column, Integer, String, DateTime, Text, Date, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from datetime import datetime, timezone


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

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)


class Movie(DeclarativeBaseModel):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    original_title = Column(String)  # Оригинальное название
    description = Column(Text)
    trailer_date = Column(DateTime, default=datetime.utcnow)
    release_date = Column(Date)
    duration = Column(Integer)  # в минутах
    budget = Column(Integer)  # бюджет в долларах
    revenue = Column(Integer)  # сборы в долларах

    # Рейтинги
    kp_rating = Column(Float)  # КиноПоиск
    imdb_rating = Column(Float)  # IMDB
    metacritic_rating = Column(Float)  # Metacritic

    # Статистика
    vote_count = Column(Integer)  # количество оценок
    popularity = Column(Float)  # популярность (TMDB)

    # Технические характеристики
    language = Column(String)
    country = Column(String)
    status = Column(String)  # Released, Post Production, etc

    # Для рекомендаций
    keywords = Column(JSON)  # ключевые слова фильма
    content_score = Column(Float)  # вычисляемый score для контентной фильтрации

class Genre(DeclarativeBaseModel):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)


# Association table
class MovieGenre(DeclarativeBaseModel):
    __tablename__ = "movie_genres"

    movie_id = Column(Integer, primary_key=True)
    genre_id = Column(Integer, primary_key=True)


class Actor(DeclarativeBaseModel):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    birth_date = Column(Date)
    death_date = Column(Date, nullable=True)
    country = Column(String)
    biography = Column(Text)

    # Для рекомендаций
    popularity = Column(Float)
    average_rating = Column(Float)  # средний рейтинг фильмов с участием


class MovieActor(DeclarativeBaseModel):
    __tablename__ = "movie_actors"

    movie_id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, primary_key=True)
    character_name = Column(String)  # имя персонажа
    is_lead_role = Column(Boolean, default=False)
    is_first_plan =Column(Boolean, default=False)
    order = Column(Integer)  # порядок в титрах

class Director(DeclarativeBaseModel):
    __tablename__ = "directors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    birth_date = Column(Date)
    death_date = Column(Date, nullable=True)
    country = Column(String)
    biography = Column(Text)

    # Для рекомендаций
    style_tags = Column(JSON)  # теги стиля режиссера
    average_rating = Column(Float)


class MovieDirector(DeclarativeBaseModel):
    __tablename__ = "movie_directors"

    movie_id = Column(Integer, primary_key=True)
    director_id = Column(Integer, primary_key=True)


class User(DeclarativeBaseModel):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Предпочтения для рекомендаций
    favorite_genres = Column(JSON)
    favorite_actors = Column(JSON)
    favorite_directors = Column(JSON)
    preferred_languages = Column(JSON)


class Review(DeclarativeBaseModel):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    rating = Column(Float)  # 1-10
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)

class WatchHistory(DeclarativeBaseModel):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    watched_at = Column(DateTime, default=datetime.utcnow)
    watch_duration = Column(Integer)  # в минутах
    rating = Column(Float)  # автоматическая оценка на основе просмотра


class ContentFeatures(DeclarativeBaseModel):
    __tablename__ = "content_features"

    movie_id = Column(Integer, primary_key=True)
    genre_vector = Column(JSON)  # вектор жанров
    actor_vector = Column(JSON)  # вектор актеров
    director_vector = Column(JSON)  # вектор режиссеров
    keyword_vector = Column(JSON)  # вектор ключевых слов
    embedding = Column(JSON)  # общий эмбеддинг для косинусного сходства


class UserPreferences(DeclarativeBaseModel):
    __tablename__ = "user_preferences"

    user_id = Column(Integer, primary_key=True)
    genre_weights = Column(JSON)  # веса предпочтений по жанрам
    actor_weights = Column(JSON)  # веса предпочтений по актерам
    director_weights = Column(JSON)  # веса предпочтений по режиссерам
    rating_tendency = Column(Float)  # склонность к высоким/низким рейтингам
    updated_at = Column(DateTime, default=datetime.utcnow)


class SimilarMovies(DeclarativeBaseModel):
    __tablename__ = "similar_movies"

    movie_id = Column(Integer, primary_key=True)
    similar_movies = Column(JSON)  # {movie_id: similarity_score}
    updated_at = Column(DateTime, default=datetime.utcnow)

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