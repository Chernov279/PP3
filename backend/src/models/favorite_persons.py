from backend.src.models.models import DeclarativeBaseModel

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column


class FavoritePersons(DeclarativeBaseModel):
    __tablename__ = "favorite_persons"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    person_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    