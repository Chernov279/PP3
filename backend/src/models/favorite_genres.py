from backend.src.models.models import DeclarativeBaseModel

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column


class FavoriteGenres(DeclarativeBaseModel):
    __tablename__ = "favorite_genres"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    genre_id: Mapped[int] = mapped_column(Integer, primary_key=True)

