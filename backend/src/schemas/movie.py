from pydantic import BaseModel
from datetime import date
from typing import List, Optional


class MovieBase(BaseModel):
    title: str
    original_title: Optional[str] = None
    description: Optional[str] = None
    release_date: Optional[date] = None
    duration: Optional[int] = None
    budget: Optional[int] = None
    revenue: Optional[int] = None


class MovieCreate(MovieBase):
    genres: List[int] = []
    actors: List[int] = []
    directors: List[int] = []


class MovieResponse(MovieBase):
    id: int
    kp_rating: Optional[float] = None
    imdb_rating: Optional[float] = None
    popularity: Optional[float] = None

    class Config:
        from_attributes = True