import datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Engine, select
from typing import List, Dict, Any, Optional
import asyncio
from backend.src.config import settings
from backend.src.models.models import Genre, Movie, MovieGenre
from backend.src.database.connection import db_helper

async def fetch_kinopoisk_collection(
    collection_type: str,
    api_key: str,
    session: AsyncSession
) -> None:
    """
    Загружает коллекцию фильмов с Кинопоиска (например, TOP_250_MOVIES)
    и сохраняет/обновляет фильмы, жанры в БД.
    """
    base_url = "https://kinopoiskapiunofficial.tech/api/v2.2/films/collections"
    page = 1
    total_pages = 1  # будет обновлено после первого запроса
    genre_cache: Dict[str, int] = {}  # название жанра -> id в БД

    async with httpx.AsyncClient() as client:
        while page <= total_pages:
            # 1. Запрос к API
            params = {
                "type": collection_type,
                "page": page
            }
            headers = {
                "X-API-KEY": api_key,
                "accept": "application/json"
            }

            response = await client.get(base_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Обновляем общее количество страниц после первого запроса
            if page == 1:
                total_pages = data.get("totalPages", 1)

            items = data.get("items", [])
            if not items:
                break

            # 2. Сохраняем фильмы в БД
            async with session.begin():
                for item in items:
                    kinopoisk_id = item.get("kinopoiskId")
                    if not kinopoisk_id:
                        continue

                    # Получаем или создаём объект фильма
                    movie = await session.get(Movie, kinopoisk_id)
                    if movie is None:
                        movie = Movie(id=kinopoisk_id)
                        session.add(movie)

                    # Заполняем поля
                    movie.title = item.get("nameRu") or item.get("nameOriginal") or "Unknown"
                    movie.original_title = item.get("nameOriginal") or item.get("nameEn")
                    movie.poster_url = item.get("posterUrl")
                    movie.kp_rating = _to_float_or_none(item.get("ratingKinopoisk"))
                    movie.imdb_rating = _to_float_or_none(item.get("ratingImbd"))  # опечатка в API?

                    # 3. Обработка жанров
                    for genre_data in item.get("genres", []):
                        genre_name = genre_data.get("genre")
                        if not genre_name:
                            continue

                        # Ищем id жанра в кэше или БД
                        genre_id = genre_cache.get(genre_name)
                        if genre_id is None:
                            stmt = select(Genre).where(Genre.name == genre_name)
                            result = await session.execute(stmt)
                            genre = result.scalar_one_or_none()
                            if genre is None:
                                genre = Genre(name=genre_name, description="")
                                session.add(genre)
                                await session.flush()  # получаем id
                                genre_id = genre.id
                            else:
                                genre_id = genre.id
                            genre_cache[genre_name] = genre_id

                        # Создаём связь, если её нет
                        stmt_mg = select(MovieGenre).where(
                            MovieGenre.movie_id == movie.id,
                            MovieGenre.genre_id == genre_id
                        )
                        result_mg = await session.execute(stmt_mg)
                        if not result_mg.scalar_one_or_none():
                            movie_genre = MovieGenre(movie_id=movie.id, genre_id=genre_id)
                            session.add(movie_genre)

            # Переходим на следующую страницу
            page += 1

def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def _to_int_or_none(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None
    

async def update_movie_details_from_api(
    session: AsyncSession,
    kinopoisk_id: int,
    api_data: Dict[str, Any]
) -> None:
    """
    Обновляет запись фильма данными из детального эндпоинта /films/{id}.
    Использует только существующие поля модели Movie.
    """
    movie = await session.get(Movie, kinopoisk_id)
    if movie is None:
        movie = Movie(id=kinopoisk_id)
        session.add(movie)

    # Названия (если вдруг в коллекции их не было)
    if not movie.title:
        movie.title = api_data.get("nameRu") or api_data.get("nameOriginal") or "Unknown"
    if not movie.original_title:
        movie.original_title = api_data.get("nameOriginal") or api_data.get("nameEn")

    # Описание
    if description := api_data.get("description"):
        movie.description = description

    # Год выпуска -> release_date (1 января)
    if year := api_data.get("year"):
        movie.release_date = datetime.date(year, 1, 1)

    # Длительность
    if duration := api_data.get("filmLength"):
        movie.duration = duration

    # Постер (если ещё нет)
    if not movie.poster_url:
        movie.poster_url = api_data.get("posterUrl")

    # Рейтинги (обновляем всегда, они могли измениться)
    movie.kp_rating = _to_float_or_none(api_data.get("ratingKinopoisk"))
    movie.imdb_rating = _to_float_or_none(api_data.get("ratingImdb"))

    # Количество голосов
    if vote_count := api_data.get("ratingKinopoiskVoteCount"):
        movie.vote_count = vote_count

    # Жанры – они уже могли быть добавлены из коллекции,
    # но можно добавить недостающие (код аналогичен вашему)
    for genre_item in api_data.get("genres", []):
        genre_name = genre_item.get("genre")
        if not genre_name:
            continue
        # Поиск/создание жанра (можно использовать genre_cache, но для простоты опустим)
        stmt = select(Genre).where(Genre.name == genre_name)
        result = await session.execute(stmt)
        genre = result.scalar_one_or_none()
        if genre is None:
            genre = Genre(name=genre_name, description="")
            session.add(genre)
            await session.flush()
        # Проверка связи
        stmt_mg = select(MovieGenre).where(
            MovieGenre.movie_id == movie.id,
            MovieGenre.genre_id == genre.id
        )
        result_mg = await session.execute(stmt_mg)
        if not result_mg.scalar_one_or_none():
            session.add(MovieGenre(movie_id=movie.id, genre_id=genre.id))


async def update_all_movies_details(
    session: AsyncSession,
    api_key: str = settings.API_KEY,
    film_ids: Optional[List[int]] = None,
    delay: float = 0.1,
) -> None:
    """
    Загружает детальную информацию для всех фильмов (или указанных ID)
    и обновляет записи в БД.
    """
    if film_ids is None:
        # Получаем все ID фильмов из БД
        stmt = select(Movie.id)
        result = await session.execute(stmt)
        film_ids = [row[0] for row in result.all()]

    total = len(film_ids)
    async with httpx.AsyncClient() as client:
        for idx, fid in enumerate(film_ids, 1):
            print(f"Обработка {idx}/{total}: фильм {fid}")
            url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{fid}"
            headers = {"X-API-KEY": api_key, "accept": "application/json"}

            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    print(f"Фильм {fid} не найден, пропускаем")
                else:
                    print(f"Ошибка HTTP для фильма {fid}: {e}")
                continue
            except Exception as e:
                print(f"Неожиданная ошибка для фильма {fid}: {e}")
                continue

            await update_movie_details_from_api(session, fid, data)
            await session.commit()  # фиксируем после каждого фильма
            if idx < total:
                await asyncio.sleep(delay)
async def main():
    async with db_helper.get_db_session() as session:
        # await fetch_kinopoisk_collection(
        #     collection_type="POPULAR_SERIES",
        #     api_key="34228a17-40b0-46bc-b7f0-b286bf790cf2",
        #     session=session
        # )
        await update_all_movies_details(
            session=session,
            api_key="34228a17-40b0-46bc-b7f0-b286bf790cf2",
        )

# Запуск
if __name__ == "__main__": 
    asyncio.run(main())