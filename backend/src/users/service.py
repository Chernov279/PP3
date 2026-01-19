from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse

from ..auth.repository import UserRepository
from ..schemas.users import UserOut, UserUpdateIn


class UserService:
    def __init__(self, db_session: AsyncSession):
        self._db_session = db_session
        self._user_repo = UserRepository(db_session)

    async def get_user(self, user_id: int):
        user = await self._user_repo.get_user_by_id(user_id, selected_columns=UserOut.get_model_columns())
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserOut.model_validate(user)


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