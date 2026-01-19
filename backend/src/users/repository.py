from sqlalchemy.ext.asyncio import AsyncSession
from ..models.models import Profile
from ..profile.schemas import ProfileCreate
from ..repositories.general_repository import SQLAlchemyRepository


class ProfileRepository(SQLAlchemyRepository):
    def __init__(self, db_session: AsyncSession):
        super().__init__(db_session, Profile)
        self.db = db_session

    async def get_profile_by_user_id(self, user_id: int) -> Profile:
        return await self.get_single(Profile.user_id == user_id)

    async def create_profile(self, profile_data: ProfileCreate) -> Profile:
        return await self.create_returning(profile_data)

    async def update_profile(self, user_id: int, profile_data: ProfileCreate) -> Profile:
        return await self.update_returning(Profile.user_id == user_id, values=profile_data)