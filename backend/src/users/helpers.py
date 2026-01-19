from datetime import date
from typing import List, Dict, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.models import Movie, Genre, MovieGenre, Review


def _to_float_or_none(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None
API_KEY= '34228a17-40b0-46bc-b7f0-b286bf790cf2'

async def fetch_user_votes(user_id: int) -> List[Dict]:
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

    async with session.begin():  # откроет транзакцию и сам закоммитит/откатит
        # подготовительный запрос существующих жанров: (опционально — ускоряет при большом числе жанров)
        # но проще: будем лениво загружать и кэшировать по мере надобности

        for it in items:
            kinopoisk_id = it.get("kinopoiskId")
            if kinopoisk_id is None:
                continue

            # ---- movie upsert ----
            # Если ты используешь kinopoiskId как PK в Movie (у тебя Movie.id), то просто get()
            movie = await session.get(Movie, kinopoisk_id)
            if movie is None:
                movie = Movie(id=kinopoisk_id)
                # если есть поля, которые хотим сразу заполнить при создании — можно передать в конструктор

            # маппинг полей (делай defensively)
            movie.title = it.get("nameRu") or it.get("nameOriginal") or movie.title or ""
            movie.original_title = it.get("nameOriginal") or it.get("nameEn") or movie.original_title
            movie.description = movie.description or ""  # API не даёт описания — оставим пустым
            # release_date: если есть year — ставим 1 января года (иначе None)
            year = it.get("year")
            if year:
                try:
                    movie.release_date = date(int(year), 1, 1)
                except Exception:
                    movie.release_date = None
            # рейтинги
            movie.kp_rating = _to_float_or_none(it.get("ratingKinopoisk"))
            movie.imdb_rating = _to_float_or_none(it.get("ratingImdb"))
            # vote_count: используем userRating как частичный источник или increment logic — тут просто ставим
            if it.get("userRating") is not None:
                try:
                    movie.vote_count = int(it.get("userRating"))
                except Exception:
                    movie.vote_count = movie.vote_count or 0
            # country: склеиваем страны через ', '
            countries = it.get("countries") or []
            country_names = [c.get("country") for c in countries if c.get("country")]
            if country_names:
                movie.country = ", ".join(country_names)

            # posterUrl / posterUrlPreview у модели нет — если нужно, добавь поле poster_url и заполни

            session.add(movie)
            # если id у фильма задан вручную (movie.id = kinopoisk_id), flush не обязателен,
            # но безопасно сделать flush чтобы убедиться, что PK доступен:
            await session.flush()

            # кешируем
            movie_cache.add(movie.id)

            # ---- genres and movie_genres ----
            for g in it.get("genres", []):
                gname = (g.get("genre") or "").strip()
                if not gname:
                    continue

                genre_id = genre_cache.get(gname)
                if genre_id is None:
                    stmt = select(Genre).where(Genre.name == gname)
                    row = await session.execute(stmt)
                    genre_obj = row.scalar_one_or_none()
                    if genre_obj is None:
                        genre_obj = Genre(name=gname, description="")
                        session.add(genre_obj)
                        await session.flush()  # чтобы получить genre_obj.id
                    genre_cache[gname] = genre_obj.id
                    genre_id = genre_obj.id

                # вставить связь если её нет
                stmt_mg = select(MovieGenre).where(
                    MovieGenre.movie_id == movie.id,
                    MovieGenre.genre_id == genre_id
                )
                res = await session.execute(stmt_mg)
                if res.scalar_one_or_none() is None:
                    mg = MovieGenre(movie_id=movie.id, genre_id=genre_id)
                    session.add(mg)

            # ---- review (user rating) ----
            if it.get("userRating") is not None:
                user_rating = _to_float_or_none(it.get("userRating"))
                if user_rating is not None:
                    # проверяем существование review (чтобы не дублировать)
                    key = (local_user_id, movie.id)
                    if key not in review_cache:
                        stmt_r = select(Review).where(
                            Review.user_id == local_user_id,
                            Review.movie_id == movie.id
                        )
                        row_r = await session.execute(stmt_r)
                        rev = row_r.scalar_one_or_none()
                        if rev is None:
                            rev = Review(
                                user_id=local_user_id,
                                movie_id=movie.id,
                                rating=user_rating,
                                text="",  # текст в API не приходит
                            )
                            session.add(rev)
                        else:
                            rev.rating = user_rating
                        review_cache.add(key)

        # транзакция автоматически закоммитится при выходе из блока