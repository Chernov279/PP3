from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from .service import RecommendationService

router = APIRouter()


@router.get("/recommendations/{user_id}", response_model=List[dict])
async def get_movie_recommendations(
        user_id: int,
        limit: int = Query(20, ge=1, le=50),
        diversity: float = Query(0.3, ge=0.0, le=1.0),
        db: Session = Depends(get_db)
):
    """
    Получить персонализированные рекомендации фильмов для пользователя

    - **user_id**: ID пользователя
    - **limit**: Количество рекомендаций (1-50)
    - **diversity**: Уровень разнообразия (0.0-1.0)
    """
    try:
        service = RecommendationService(db)
        recommendations = service.get_personalized_recommendations(
            user_id=user_id,
            limit=limit,
            diversity_boost=diversity
        )

        return {
            "user_id": user_id,
            "recommendations_count": len(recommendations),
            "recommendations": recommendations,
            "algorithm_version": "hybrid_v2"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/explain/{user_id}/{movie_id}")
async def explain_recommendation(
        user_id: int,
        movie_id: int,
        db: Session = Depends(get_db)
):
    """Объяснить почему рекомендован конкретный фильм"""
    service = RecommendationService(db)

    # Получаем расширенное объяснение
    explanation = service.explain_recommendation(user_id, movie_id)

    return {
        "user_id": user_id,
        "movie_id": movie_id,
        "explanation": explanation
    }