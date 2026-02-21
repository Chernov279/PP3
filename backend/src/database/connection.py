from asyncio import current_task
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, async_scoped_session, AsyncSession

from backend.src.config import settings

DATABASE_URL = settings.POSTGRES_URL


class DatabaseHelper:
    def __init__(self, url: str, echo: bool):
        self.engine = create_async_engine(url=url, echo=echo)

        self.session_factory = async_sessionmaker(
            bind=self.engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False
        )

    def get_scope_session(self):
        return async_scoped_session(
            session_factory=self.session_factory,
            scopefunc=current_task
        )

    @asynccontextmanager
    async def get_db_session(self):
        from sqlalchemy import exc
        session: AsyncSession = self.session_factory()
        try:
            yield session
        except exc.SQLAlchemyError as e:
            await session.rollback()
            raise
        finally:
            await session.close()


db_helper = DatabaseHelper(DATABASE_URL,True)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with db_helper.get_db_session() as session:
        yield session
