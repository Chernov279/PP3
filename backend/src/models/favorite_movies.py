from backend.src.models.models import DeclarativeBaseModel

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column


class FavoriteMovies(DeclarativeBaseModel):
    __tablename__ = "favorite_movies"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    