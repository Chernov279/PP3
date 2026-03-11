from typing import List

from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.models.favorite_genres import FavoriteGenres
from backend.src.models.models import Genre


class GenreService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get_genre_or_404(self, genre_id: int) -> Genre:
        result = await self.session.execute(
            select(Genre).where(Genre.id == genre_id)
        )
        genre = result.scalars().first()
        if not genre:
            raise HTTPException(status_code=404, detail="Genre not found")
        return genre

    async def get_favorite_genres(self, user_id: int) -> List[Genre]:
        stmt = (
            select(Genre)
            .join(FavoriteGenres, FavoriteGenres.genre_id == Genre.id)
            .where(FavoriteGenres.user_id == user_id)
            .order_by(Genre.name.asc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def add_to_favorite(self, genre_id: int, user_id: int) -> bool:
        await self._get_genre_or_404(genre_id)

        favorite = FavoriteGenres(user_id=user_id, genre_id=genre_id)
        self.session.add(favorite)
        try:
            await self.session.commit()
            return True
        except IntegrityError:
            await self.session.rollback()
            return True
        except Exception:
            await self.session.rollback()
            return False

    async def remove_from_favorite(self, genre_id: int, user_id: int) -> bool:
        stmt = delete(FavoriteGenres).where(
            FavoriteGenres.user_id == user_id,
            FavoriteGenres.genre_id == genre_id,
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

