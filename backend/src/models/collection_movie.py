from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.models.models import DeclarativeBaseModel


class CollectionMovie(DeclarativeBaseModel):
    __tablename__ = "collection_movies"
    __table_args__ = (
        UniqueConstraint("collection_id", "movie_id", name="uq_collection_movie"),
    )

    collection_id: Mapped[int] = mapped_column(
        ForeignKey("collections.id", ondelete="CASCADE"),
        primary_key=True,
    )
    movie_id: Mapped[int] = mapped_column(
        ForeignKey("movies.id", ondelete="CASCADE"),
        primary_key=True,
    )

    added_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    