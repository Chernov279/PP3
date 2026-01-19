from typing import List

from backend.src.models.models import Profile
from backend.src.schemas.base import BaseSchema


class UserProfileOut(BaseSchema):
    id: int
    user_id: int
    favorite_genres: List[str]
    favorite_actors: List[str]
    watched_movies: List[int]
    favorite_movies: List[int]
    imdb_connected: bool
    kinopoisk_connected: bool
    created_at: str
    updated_at: str

class ProfileCreate(BaseSchema):
    __model__ = Profile
    user_id: int
    bio: str