from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.database.connection import get_db_session
from .service import UserService
from ..auth.dependencies import get_token_sub_required
from ..auth.schemas import UserOut, UserUpdateIn

user = APIRouter(prefix="/user", tags=["user"])
async def get_user_service(
    session: AsyncSession = Depends(get_db_session),
) -> UserService:
    return UserService(session)


@user.get("/me")
async def get_user_me(
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user(user_id)


@user.get("/{user_id}/films")
async def user_films_history(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user_films_history(user_id)


@user.get("/{user_id}")
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.get_user(user_id)


@user.put("/", response_model=UserOut)
async def update_user(
    user_data: UserUpdateIn,
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.update_user(user_id, user_data)

@user.delete("/", response_model=UserOut)
async def delete_user(
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.delete_user(user_id)


@user.post("/sync_kinopoisk_info")
async def sync_kinopoisk_watch_history(
        kinopoisk_id: int,
        debug_user_id: int,
        user_id: int = Depends(get_token_sub_required),
        user_service: UserService = Depends(get_user_service)
):
    """
    Синхронизирует историю просмотров пользователя с Kinopoisk API.
    """
    
    user = await user_service.sync_kinopoisk_info(kinopoisk_id, user_id or debug_user_id)

    return user