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

@films.get("/{film_id}")
async def get_film(
    film_id: int = 725190,
    user_id: int = Depends(get_token_sub_required),
    service: FilmService = Depends(get_film_service)
):
    return await service.get_film(film_id)

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