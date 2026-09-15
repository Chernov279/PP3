from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.collections.schemas import (
    CollectionCreate,
    CollectionUpdate,
)
from backend.src.models.collection_movie import CollectionMovie
from backend.src.models.collections import Collection
from backend.src.models.models import Movie


class CollectionService:
    def __init__(self, db_session: AsyncSession):
        self._db = db_session

    async def _get_or_404(self, collection_id: int) -> Collection:
        stmt = select(Collection).where(Collection.id == collection_id)
        collection = (await self._db.execute(stmt)).scalar_one_or_none()
        if not collection:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Collection not found")
        return collection

    def _ensure_owner(self, collection: Collection, user_id: int) -> None:
        if collection.user_id != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not the owner")

    async def create(self, user_id: int, data: CollectionCreate) -> Collection:
        collection = Collection(
            user_id=user_id,
            title=data.title,
            description=data.description,
            is_public=data.is_public,
        )
        self._db.add(collection)
        await self._db.commit()
        await self._db.refresh(collection)
        return collection

    async def get_one(self, collection_id: int, user_id: Optional[int]) -> Collection:
        collection = await self._get_or_404(collection_id)
        if not collection.is_public and collection.user_id != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Collection is private")
        return collection

    async def list_my(
        self, user_id: int, page: int, size: int
    ) -> tuple[list[Collection], int]:
        base = select(Collection).where(Collection.user_id == user_id)

        total = (
            await self._db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        stmt = (
            base.order_by(Collection.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        items = list((await self._db.execute(stmt)).scalars().all())
        return items, total

    async def list_public(
        self, page: int, size: int
    ) -> tuple[list[Collection], int]:
        base = select(Collection).where(Collection.is_public.is_(True))

        total = (
            await self._db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        stmt = (
            base.order_by(Collection.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        items = list((await self._db.execute(stmt)).scalars().all())
        return items, total

    async def search(
        self, q: str, page: int, size: int, only_public: bool = True
    ) -> tuple[list[Collection], int]:
        pattern = f"%{q.lower()}%"
        base = select(Collection).where(
            (func.lower(Collection.title).like(pattern))
            | (func.lower(func.coalesce(Collection.description, "")).like(pattern))
        )
        if only_public:
            base = base.where(Collection.is_public.is_(True))

        total = (
            await self._db.execute(
                select(func.count()).select_from(base.subquery())
            )
        ).scalar_one()

        stmt = (
            base.order_by(Collection.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
        items = list((await self._db.execute(stmt)).scalars().all())
        return items, total

    async def update(
        self, collection_id: int, user_id: int, data: CollectionUpdate
    ) -> Collection:
        collection = await self._get_or_404(collection_id)
        self._ensure_owner(collection, user_id)

        payload = data.model_dump(exclude_unset=True)
        for field, value in payload.items():
            setattr(collection, field, value)

        await self._db.commit()
        await self._db.refresh(collection)
        return collection

    async def delete(self, collection_id: int, user_id: int) -> None:
        collection = await self._get_or_404(collection_id)
        self._ensure_owner(collection, user_id)

        await self._db.delete(collection)
        await self._db.commit()

    async def add_movie(
        self, collection_id: int, movie_id: int, user_id: int
    ) -> None:
        collection = await self._get_or_404(collection_id)
        self._ensure_owner(collection, user_id)

        movie_exists = (
            await self._db.execute(select(Movie.id).where(Movie.id == movie_id))
        ).scalar_one_or_none()
        if not movie_exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Movie not found")

        already = (
            await self._db.execute(
                select(CollectionMovie).where(
                    CollectionMovie.collection_id == collection_id,
                    CollectionMovie.movie_id == movie_id,
                )
            )
        ).scalar_one_or_none()
        if already:
            raise HTTPException(status.HTTP_409_CONFLICT, "Movie already in collection")

        link = CollectionMovie(collection_id=collection_id, movie_id=movie_id)
        self._db.add(link)
        await self._db.commit()

    async def remove_movie(
        self, collection_id: int, movie_id: int, user_id: int
    ) -> None:
        collection = await self._get_or_404(collection_id)
        self._ensure_owner(collection, user_id)

        link = (
            await self._db.execute(
                select(CollectionMovie).where(
                    CollectionMovie.collection_id == collection_id,
                    CollectionMovie.movie_id == movie_id,
                )
            )
        ).scalar_one_or_none()
        if not link:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Movie not in collection")

        await self._db.delete(link)
        await self._db.commit()

    async def get_movies(self, collection_id: int) -> list[Movie]:
        stmt = (
            select(Movie)
            .join(CollectionMovie, CollectionMovie.movie_id == Movie.id)
            .where(CollectionMovie.collection_id == collection_id)
            .order_by(CollectionMovie.added_at.desc())
        )
        return list((await self._db.execute(stmt)).scalars().all())