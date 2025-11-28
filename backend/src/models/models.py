from sqlalchemy import Column, Integer, String, DateTime, Text, Date, JSON, Float, Boolean
from sqlalchemy.orm import relationship

from ..database.connection import Base
from datetime import datetime


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)


class Movie(Base):
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

    # Связи
    genres = relationship("Genre", secondary="movie_genres", back_populates="movies")
    actors = relationship("Actor", secondary="movie_actors", back_populates="movies")
    directors = relationship("Director", secondary="movie_directors", back_populates="movies")
    reviews = relationship("Review", back_populates="movie")


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)

    movies = relationship("Movie", secondary="movie_genres", back_populates="genres")


# Association table
class MovieGenre(Base):
    __tablename__ = "movie_genres"

    movie_id = Column(Integer, primary_key=True)
    genre_id = Column(Integer, primary_key=True)


class Actor(Base):
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

    movies = relationship("Movie", secondary="movie_actors", back_populates="actors")


class MovieActor(Base):
    __tablename__ = "movie_actors"

    movie_id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, primary_key=True)
    character_name = Column(String)  # имя персонажа
    is_lead_role = Column(Boolean, default=False)
    is_first_plan =Column(Boolean, default=False)
    order = Column(Integer)  # порядок в титрах

class Director(Base):
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

    movies = relationship("Movie", secondary="movie_directors", back_populates="directors")


class MovieDirector(Base):
    __tablename__ = "movie_directors"

    movie_id = Column(Integer, primary_key=True)
    director_id = Column(Integer, primary_key=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Предпочтения для рекомендаций
    favorite_genres = Column(JSON)
    favorite_actors = Column(JSON)
    favorite_directors = Column(JSON)
    preferred_languages = Column(JSON)

    reviews = relationship("Review", back_populates="user")
    watch_history = relationship("WatchHistory", back_populates="user")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    rating = Column(Float)  # 1-10
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)

    user = relationship("User", back_populates="reviews")
    movie = relationship("Movie", back_populates="reviews")


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    movie_id = Column(Integer, index=True)
    watched_at = Column(DateTime, default=datetime.utcnow)
    watch_duration = Column(Integer)  # в минутах
    rating = Column(Float)  # автоматическая оценка на основе просмотра

    user = relationship("User", back_populates="watch_history")


class ContentFeatures(Base):
    __tablename__ = "content_features"

    movie_id = Column(Integer, primary_key=True)
    genre_vector = Column(JSON)  # вектор жанров
    actor_vector = Column(JSON)  # вектор актеров
    director_vector = Column(JSON)  # вектор режиссеров
    keyword_vector = Column(JSON)  # вектор ключевых слов
    embedding = Column(JSON)  # общий эмбеддинг для косинусного сходства


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id = Column(Integer, primary_key=True)
    genre_weights = Column(JSON)  # веса предпочтений по жанрам
    actor_weights = Column(JSON)  # веса предпочтений по актерам
    director_weights = Column(JSON)  # веса предпочтений по режиссерам
    rating_tendency = Column(Float)  # склонность к высоким/низким рейтингам
    updated_at = Column(DateTime, default=datetime.utcnow)


class SimilarMovies(Base):
    __tablename__ = "similar_movies"

    movie_id = Column(Integer, primary_key=True)
    similar_movies = Column(JSON)  # {movie_id: similarity_score}
    updated_at = Column(DateTime, default=datetime.utcnow)