from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.auth.dependencies import (
    get_token_sub_required,
)
from backend.src.api.genres.service import GenreService
from backend.src.database.connection import get_db_session


genres = APIRouter(prefix="/genres", tags=["genres"])


async def get_genre_service(
    session: AsyncSession = Depends(get_db_session),
) -> GenreService:
    return GenreService(session)


@genres.get("/favorite")
async def get_favorites(
    user_id=Depends(get_token_sub_required),
    genre_service: GenreService = Depends(get_genre_service),
):
    return await genre_service.get_favorite_genres(user_id)


@genres.post("/favorite/{genre_id}")
async def add_genre_favorite(
    genre_id: int,
    user_id=Depends(get_token_sub_required),
    genre_service: GenreService = Depends(get_genre_service),
):
    return await genre_service.add_to_favorite(genre_id, user_id)


@genres.delete("/favorite/{genre_id}")
async def delete_genre_favorite(
    genre_id: int,
    user_id=Depends(get_token_sub_required),
    genre_service: GenreService = Depends(get_genre_service),
):
    return await genre_service.remove_from_favorite(genre_id, user_id)

