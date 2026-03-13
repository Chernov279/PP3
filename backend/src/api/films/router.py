from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.database.connection import get_db_session
from .service import FilmService
from ..auth.dependencies import get_token_sub_required

films = APIRouter(prefix="/films", tags=["films"])
async def get_film_service(
    session: AsyncSession = Depends(get_db_session),
) -> FilmService:
    return FilmService(session)

@films.get("/all-genres")
async def get_all_genres(
    user_id: int = Depends(get_token_sub_required),
    service: FilmService = Depends(get_film_service)
):
    return await service.get_all_genres()


@films.get("/search")
async def search_film(
    q: str | None = None,
    page: int = 1,
    service: FilmService = Depends(get_film_service)
):
    return await service.search_film(q, page)

@films.get("/favorite")
async def get_favorite_movies(
    user_id: int = Depends(get_token_sub_required),
    movie_service: FilmService = Depends(get_film_service),
):
    """Получить список избранных фильмов текущего пользователя."""
    return await movie_service.get_favorite_movies(user_id)

@films.post("/favorite/{movie_id}")
async def add_movie_to_favorites(
    movie_id: int,
    user_id: int = Depends(get_token_sub_required),
    movie_service: FilmService = Depends(get_film_service),
):
    """Добавить фильм в избранное."""
    return await movie_service.add_to_favorites(movie_id, user_id)

@films.delete("/favorite/{movie_id}")
async def remove_movie_from_favorites(
    movie_id: int,
    user_id: int = Depends(get_token_sub_required),
    movie_service: FilmService = Depends(get_film_service),
):
    """Удалить фильм из избранного."""
    return await movie_service.remove_from_favorites(movie_id, user_id)

@films.get("/{film_id}/genres")
async def get_film_genres(
    film_id: int = 725190,
    user_id: int = Depends(get_token_sub_required),
    service: FilmService = Depends(get_film_service)
):
    return await service.get_film_genres(film_id)

@films.get("/{film_id}/similars")
async def get_film_similars(
    film_id: int = 725190,
    user_id: int = Depends(get_token_sub_required),
    service: FilmService = Depends(get_film_service)
):
    return await service.get_film_similars(film_id)