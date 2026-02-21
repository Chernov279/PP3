from pydantic import BaseModel
from typing import Optional

from pydantic import BaseModel
from typing import Optional, List

class GenreInfo(BaseModel):
    id: int
    name: str

class RecommendedFilmOut(BaseModel):
    id: int
    title: str
    original_title: Optional[str] = None
    poster_url: Optional[str] = None
    kp_rating: Optional[float] = None
    imdb_rating: Optional[float] = None
    year: Optional[int] = None
    genres: List[GenreInfo] = []

    # Индикаторы (значения от 0 до 1)
    popularity_score: float
    novelty_score: float
    personalization_score: Optional[float] = None
    total_score: float

    class Config:
        from_attributes = True