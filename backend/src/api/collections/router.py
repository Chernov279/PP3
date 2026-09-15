from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.collections.schemas import (
    CollectionCreate,
    CollectionDetailOut,
    CollectionOut,
    CollectionPage,
    CollectionUpdate,
)
from backend.src.api.collections.service import CollectionService
from backend.src.api.auth.dependencies import get_token_sub_optional, get_token_sub_required
from backend.src.database.connection import get_db_session

collections = APIRouter(prefix="/collections", tags=["Collections"])


def get_collection_service(
    db_session: AsyncSession = Depends(get_db_session),
) -> CollectionService:
    return CollectionService(db_session)


def _pages(total: int, size: int) -> int:
    return (total + size - 1) // size if size else 0


@collections.post("", response_model=CollectionOut, status_code=201)
async def create_collection(
    data: CollectionCreate,
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    return await service.create(user_id, data)


@collections.get("/my", response_model=CollectionPage)
async def list_my_collections(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    items, total = await service.list_my(user_id, page, size)
    return CollectionPage(
        items=[CollectionOut.model_validate(x) for x in items],
        total=total,
        page=page,
        pages=_pages(total, size),
    )


@collections.get("/public", response_model=CollectionPage)
async def list_public_collections(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: CollectionService = Depends(get_collection_service),
):
    items, total = await service.list_public(page, size)
    return CollectionPage(
        items=[CollectionOut.model_validate(x) for x in items],
        total=total,
        page=page,
        pages=_pages(total, size),
    )


@collections.get("/search", response_model=CollectionPage)
async def search_collections(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    only_public: bool = Query(True),
    service: CollectionService = Depends(get_collection_service),
):
    items, total = await service.search(q, page, size, only_public)
    return CollectionPage(
        items=[CollectionOut.model_validate(x) for x in items],
        total=total,
        page=page,
        pages=_pages(total, size),
    )


@collections.get("/{collection_id}", response_model=CollectionDetailOut)
async def get_collection(
    collection_id: int,
    user_id: int = Depends(get_token_sub_optional),
    service: CollectionService = Depends(get_collection_service),
):
    collection = await service.get_one(collection_id, user_id)
    movies = await service.get_movies(collection_id)

    detail = CollectionDetailOut.model_validate(collection)
    detail.movies = [m for m in movies]
    return detail


@collections.patch("/{collection_id}", response_model=CollectionOut)
async def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    return await service.update(collection_id, user_id, data)


@collections.delete("/{collection_id}", status_code=204)
async def delete_collection(
    collection_id: int,
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    await service.delete(collection_id, user_id)


@collections.post("/{collection_id}/movies/{movie_id}", status_code=204)
async def add_movie_to_collection(
    collection_id: int,
    movie_id: int,
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    await service.add_movie(collection_id, movie_id, user_id)


@collections.delete("/{collection_id}/movies/{movie_id}", status_code=204)
async def remove_movie_from_collection(
    collection_id: int,
    movie_id: int,
    user_id: int = Depends(get_token_sub_required),
    service: CollectionService = Depends(get_collection_service),
):
    await service.remove_movie(collection_id, movie_id, user_id)
    