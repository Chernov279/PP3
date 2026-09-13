from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse

from backend.src.api.users.parser import fetch_user_reactions
from backend.src.models.models import Profile, User

from .env import cookies
from .helpers import save_user_reactions_to_db, sync_user_votes, fetch_user_votes
from ..auth.repository import UserRepository
from ..auth.schemas import UserUpdateIn, UserOut
from ..films.repository import MovieRepository


class UserService:

    def __init__(self, db_session: AsyncSession):
        self._db_session = db_session
        self._user_repo = UserRepository(db_session)
        self.movie_repo = MovieRepository(db_session)

    async def get_user(self, user_id: int):
        user = await self._user_repo.get_user_by_id(user_id, selected_columns=UserOut.get_model_columns())
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserOut.model_validate(user)
    
    async def get_user_films_history(self, user_id: int):
        user = await self._user_repo.get_user_by_id(user_id, selected_columns=UserOut.get_model_columns())
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        films = await self.movie_repo.get_user_films_history(user_id)
        return films


    async def update_user(self, user_id: int, user_data: UserUpdateIn) -> UserOut:
        user = await self._user_repo.update_user_returning(user_data, user_id, UserOut.get_model_columns())
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await self._db_session.commit()
        return UserOut.model_validate(user)

    async def delete_user(self, user_id: int):
        if await self._user_repo.delete_user(user_id):
            await self._db_session.commit()
            return JSONResponse(status_code=204, content={"message": "User deleted successfully"})
        return HTTPException(status_code=404, detail="User not found")

    async def get_profile_by_user_id(self, user_id: int) -> Profile:
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await self._db_session.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            profile = Profile(user_id=user_id)
            self._db_session.add(profile)
            await self._db_session.commit()
            await self._db_session.refresh(profile)
        return profile

    async def upload_avatar(self, user_id: int, file, storage_service) -> str:
        profile = await self.get_profile_by_user_id(user_id)
        old_url = profile.avatar_url

        new_url = await storage_service.upload_avatar(user_id, file)

        if old_url:
            key = old_url.split(f"{storage_service.bucket_name}/")[-1]
            storage_service.delete_avatar(key)

        profile.avatar_url = new_url
        await self._db_session.commit()
        await self._db_session.refresh(profile)
        return new_url

    async def delete_avatar(self, user_id: int, storage_service) -> Profile:
        profile = await self.get_profile_by_user_id(user_id)
        if not profile.avatar_url:
            raise HTTPException(404, "Avatar not found")
        
        key = profile.avatar_url.split(f"{storage_service.bucket_name}/")[-1]
        storage_service.delete_avatar(key)
        
        profile.avatar_url = None
        await self._db_session.commit()
        await self._db_session.refresh(profile)
        return profile


    async def sync_kinopoisk_info(self, user_kinopoisk_id, user_id):
        
        items = await fetch_user_reactions(user_kinopoisk_id, cookies)

        await save_user_reactions_to_db(self._db_session, items, user_id)
        await self._user_repo.update(User.id == user_id, values={"is_kinopoisk_synchronized": True})
        await self._db_session.commit()
        return JSONResponse(status_code=200, content={"message": "User info synced successfully"})