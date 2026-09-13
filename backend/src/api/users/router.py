from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.users.helpers import map_user_out
from backend.src.database.connection import get_db_session
from backend.src.database.s3.storage_service import S3StorageService
from .service import UserService
from ..auth.dependencies import get_token_sub_required
from ..auth.schemas import UserOut, UserUpdateIn

user = APIRouter(prefix="/users", tags=["user"])
v2_user = APIRouter(prefix="/v2/users", tags=["user"])

async def get_user_service(
    session: AsyncSession = Depends(get_db_session),
) -> UserService:
    return UserService(session)


def get_storage_service() -> S3StorageService:
    return S3StorageService()

@user.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(get_token_sub_required),
    profile_service: UserService = Depends(get_user_service),
    storage_service: S3StorageService = Depends(get_storage_service),
):
    url = await profile_service.upload_avatar(user_id, file, storage_service)
    return url

@user.delete("/me/avatar")
async def delete_avatar(
    user_id: int = Depends(get_token_sub_required),
    profile_service: UserService = Depends(get_user_service),
    storage_service: S3StorageService = Depends(get_storage_service),
):
    profile = await profile_service.delete_avatar(user_id, storage_service)
    return profile.avatar_url


@user.get("/me")
async def get_user_me(
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    user = await user_service.get_user(user_id)
    profile = await user_service.get_profile_by_user_id(user_id)
    return map_user_out(user, avatar_url=profile.avatar_url)


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

@v2_user.put(
        "/me",
        response_model=UserOut,
        summary="Обновление данных пользователя"
    )
async def update_user_me(
    user_data: UserUpdateIn,
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    """
    Обновить данные пользователя.

    Args:
        user_data (UserUpdateIn): Словарь с обновляемыми данными пользователя
        user_id (int): Идентификатор пользователя
        user_service (UserService): Сервис для работы с пользователями

    Returns:
        UserOut: Обновленный объект пользователя
    """
    return await user_service.update_user(user_id, user_data)


@user.delete("/", response_model=UserOut)
async def delete_user(
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.delete_user(user_id)

@v2_user.delete(
        "/me",
        response_model=None, 
        status_code=status.HTTP_204_NO_CONTENT,
        summary="Удаление пользователя"
    )
async def delete_user_me(
    user_id: int = Depends(get_token_sub_required),
    user_service: UserService = Depends(get_user_service)
):
    """
    Удалить данные текущего пользователя.

    Args:
        user_id (int): Идентификатор пользователя
        user_service (UserService): Сервис для работы с пользователями

    Returns:
        UserOut: Обновленный объект пользователя
    """

    return await user_service.delete_user(user_id)

@user.post("/sync_kinopoisk_info")
async def sync_kinopoisk_watch_history(
        kinopoisk_id: int,
        user_id: int = Depends(get_token_sub_required),
        user_service: UserService = Depends(get_user_service)
):
    """
    Синхронизирует историю просмотров пользователя с Kinopoisk API.
    """
    
    user = await user_service.sync_kinopoisk_info(kinopoisk_id, user_id)

    return user

