from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CollectionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class CollectionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CollectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime


class CollectionDetailOut(CollectionOut):
    movies: list["MovieInCollection"] = []


class MovieInCollection(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    poster_url: Optional[str] = None
    release_date: Optional[datetime] = None
    kp_rating: Optional[float] = None


class CollectionPage(BaseModel):
    items: list[CollectionOut]
    total: int
    page: int
    pages: int


CollectionDetailOut.model_rebuild()