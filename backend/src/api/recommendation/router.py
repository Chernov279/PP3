from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.src.api.recommendation.schemas import RecommendedFilmOut
from .service import RecommendationService
from backend.src.database.connection import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession

recommendations = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@recommendations.get("/", response_model=List[RecommendedFilmOut])
async def get_recommendations(
    user_id: Optional[int] = Query(None, description="ID пользователя для персонализации"),
    popularity_weight: float | None = Query(0.33, ge=0, le=1, description="Вес популярности"),
    novelty_weight: float = Query(0.33, ge=0, le=1, description="Вес новизны"),
    personalization_weight: float = Query(0.34, ge=0, le=1, description="Вес персонализации"),
    genre_ids: Optional[List[int]] = Query(None, description="Фильтр по жанрам"),
    exclude_genre_ids: Optional[List[int]] = Query(None, description="Какие жанры фильмов необходимо исключить"),
    year_from: Optional[int] = Query(None, ge=1900, le=2100, description="Начальный год выпуска"),
    year_to: Optional[int] = Query(None, ge=1900, le=2100, description="Конечный год выпуска"),
    limit: int = Query(20, ge=1, le=100, description="Количество рекомендаций"),
    session: AsyncSession = Depends(get_db_session)
):
    """
    Персонализированные рекомендации фильмов с регулируемыми весами популярности, новизны и похожести на просмотренное.
    Если user_id не указан, персонализация отключается.
    """
    rec_service = RecommendationService(session)
    return await rec_service.get_recommendations(
        user_id=user_id,
        popularity_weight=popularity_weight,
        novelty_weight=novelty_weight,
        personalization_weight=personalization_weight,
        genre_ids=genre_ids,
        exclude_genre_ids=exclude_genre_ids,
        year_from=year_from,
        year_to=year_to,
        limit=limit
    )
