import asyncio
from datetime import date, datetime
from turtle import title
from typing import List, Dict, Optional
from venv import create

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.fetch_films.service import update_all_movies_details
from backend.src.models.models import Movie, Genre, MovieGenre, Review, WatchHistory


def _to_float_or_none(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None
API_KEY= '34228a17-40b0-46bc-b7f0-b286bf790cf2'

async def fetch_user_votes(user_id: int = 160202875) -> List[Dict]:
    """
    Получает все голоса пользователя с Kinopoisk API.
    Пагинация учтена.
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v1/kp_users/{user_id}/votes"
    items: List[Dict] = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        page = 1
        while True:
            resp = await client.get(
                url,
                params={"page": page},
                headers={"X-API-KEY": API_KEY, "accept": "application/json"},
            )
            resp.raise_for_status()  # выбросит исключение при 4xx/5xx

            data = resp.json()
            items.extend(data.get("items", []))

            total_pages = data.get("totalPages", 1)
            if page >= total_pages:
                break
            page += 1
    return items

async def sync_user_votes(
    items: List[Dict],
    local_user_id: int,
    session: AsyncSession,
) -> None:
    """
    Синхронизировать список голосов (items) в БД.
    items — список объектов из API['items'].
    local_user_id — id локального пользователя (в нашей БД).
    """
    # локальные кэши на время вызова, чтобы не дергать БД для каждого жанра/фильма
    genre_cache: dict[str, int] = {}   # name -> genre.id
    movie_cache: set[int] = set()     # movie.id (kinopoiskId), чтобы не делать лишних запросов
    review_cache: set[tuple[int,int]] = set()  # (user_id, movie_id)

    for item in items:
        kinopoisk_id = item.get("kinopoiskId")
        if kinopoisk_id is None:
            continue

        # 1. Получить или создать фильм
        movie = await session.get(Movie, kinopoisk_id)
        if movie is None:
            movie = Movie(
                id=kinopoisk_id,
                title=item.get("nameRu") or item.get("nameOriginal") or "Unknown",
                original_title=item.get("nameOriginal") or item.get("nameEn"),
                
                
                )

        # 2. Заполнить/обновить основные поля
        if not movie.title:
            movie.title = item.get("nameRu") or item.get("nameOriginal") or "Unknown"
        if not movie.original_title:
            movie.original_title = item.get("nameOriginal") or item.get("nameEn")
        if not movie.poster_url:
            movie.poster_url = item.get("posterUrl")
        # Рейтинги (обновляем всегда)
        movie.kp_rating = _to_float_or_none(item.get("ratingKinopoisk"))
        movie.imdb_rating = _to_float_or_none(item.get("ratingImdb"))
        # vote_count не трогаем — это количество голосов, а не оценка

        session.add(movie)

        # 3. Жанры
        for g in item.get("genres", []):
            gname = (g.get("genre") or "").strip()
            if not gname:
                continue

            # Найти или создать жанр
            genre_id = genre_cache.get(gname)
            if genre_id is None:
                stmt = select(Genre).where(Genre.name == gname)
                result = await session.execute(stmt)
                genre_obj = result.scalar_one_or_none()
                if genre_obj is None:
                    genre_obj = Genre(name=gname, description="")
                    session.add(genre_obj)
                    await session.flush()  # получить id
                    genre_id = genre_obj.id
                else:
                    genre_id = genre_obj.id
                genre_cache[gname] = genre_id

            # Связь фильм-жанр
            stmt_mg = select(MovieGenre).where(
                MovieGenre.movie_id == movie.id,
                MovieGenre.genre_id == genre_id
            )
            res = await session.execute(stmt_mg)
            if not res.scalar_one_or_none():
                mg = MovieGenre(movie_id=movie.id, genre_id=genre_id)
                session.add(mg)

        # 4. Оценка пользователя (Review)
        user_rating_val = item.get("userRating")
        if user_rating_val is not None:
            try:
                user_rating = float(user_rating_val)
            except (TypeError, ValueError):
                continue  # невалидная оценка → пропускаем

            key = (local_user_id, movie.id)
            if key not in review_cache:
                stmt_r = select(Review).where(
                    Review.user_id == local_user_id,
                    Review.movie_id == movie.id
                )
                result_r = await session.execute(stmt_r)
                review = result_r.scalar_one_or_none()
                if review is None:
                    review = Review(
                        user_id=local_user_id,
                        movie_id=movie.id,
                        rating=user_rating,
                        text="",
                    )
                    session.add(review)
                else:
                    review.rating = user_rating
                review_cache.add(key)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import Dict, Any

async def save_user_reactions_to_db(
    session: AsyncSession,
    items: List[Dict[str, Any]],
    local_user_id: int  # ID пользователя в вашей БД
) -> None:
    """
    Сохраняет полученные из API данные о фильмах и реакциях в БД.
    """
    genre_cache: Dict[str, int] = {}  # название жанра -> id
    movie_cache: Dict[int, Movie] = {}  # kinopoisk_id -> объект Movie

    for item in items:
        movie_data = item["movie"]
        kp_id = movie_data["id"]

        # 1. Получить или создать объект Movie
        if kp_id in movie_cache:
            movie = movie_cache[kp_id]
        else:
            movie = await session.get(Movie, kp_id)
            if movie is None:
                await update_all_movies_details(
                    session=session,
                    film_ids=[kp_id,],
                )

        # 3. Жанры
        for genre_item in movie_data.get("genres", []):
            genre_name = genre_item["name"]
            genre_id = genre_cache.get(genre_name)

            if genre_id is None:
                # Ищем жанр в БД
                stmt = select(Genre).where(Genre.name == genre_name)
                result = await session.execute(stmt)
                genre = result.scalar_one_or_none()
                if genre is None:
                    genre = Genre(name=genre_name, description="")
                    session.add(genre)
                    await session.flush()
                    genre_id = genre.id
                else:
                    genre_id = genre.id
                genre_cache[genre_name] = genre_id

            # Проверяем связь
            stmt_mg = select(MovieGenre).where(
                MovieGenre.movie_id == kp_id,
                MovieGenre.genre_id == genre_id
            )
            result_mg = await session.execute(stmt_mg)
            if not result_mg.scalar_one_or_none():
                session.add(MovieGenre(movie_id=kp_id, genre_id=genre_id))

        # 4. Обработка реакций
        for reaction in item.get("reactions", []):
            stmt_wh = select(WatchHistory).where(
                WatchHistory.user_id == local_user_id,
                WatchHistory.movie_id == kp_id
            )
            result_wh = await session.execute(stmt_wh)
            watch_history = result_wh.scalar_one_or_none()

            if watch_history is None:
                watch_history = WatchHistory(
                    user_id=local_user_id,
                    movie_id=kp_id
                )
                session.add(watch_history)


        # Сохраняем изменения после каждого фильма (можно и после всех)
        await session.commit()