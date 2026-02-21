from sqlalchemy import select

from backend.src.models.models import Movie, WatchHistory
from backend.src.repositories.general_repository import SQLAlchemyRepository


class MovieRepository(SQLAlchemyRepository[Movie]):
    def __init__(self, db_session):
        super().__init__(db_session, Movie)

    async def get_watched_movies_ids(self, user_id: int) -> list[int]:
        stmt = (
            select(WatchHistory.movie_id)
            .where(
                WatchHistory.user_id == user_id
            )
        )
        result = await self.db_session.execute(stmt)
        return result.scalars().all()

    async def get_favorite_movies_ids(self, user_id: int) -> list[int]:
        stmt = (
            select(WatchHistory.movie_id)
            .where(
                WatchHistory.user_id == user_id
            )
        )
        result = await self.db_session.execute(stmt)
        return result.scalars().all()

    async def get_user_films_history(self, user_id: int):
        stmt = (
            select(WatchHistory, Movie)
            .join(Movie, WatchHistory.movie_id == Movie.id)
            .where(WatchHistory.user_id == user_id)
        )
        result = await self.db_session.execute(stmt)
        rows = result.all()

        history_list = []
        for watch_history, movie in rows:
            history_list.append({
                "watch_history": {
                    "id": watch_history.id,
                    "user_id": watch_history.user_id,
                    "movie_id": watch_history.movie_id,
                    "watched_at": watch_history.watched_at.isoformat() if watch_history.watched_at else None,
                    "watch_duration": watch_history.watch_duration,
                    "rating": watch_history.rating,
                },
                "movie": {
                    "id": movie.id,
                    "title": movie.title,
                    "original_title": movie.original_title,
                    "poster_url": movie.poster_url,
                    "kp_rating": movie.kp_rating,
                    "description": movie.description,
                    "release_date": movie.release_date,
                    "duration": movie.duration,
                    "imdb_rating": movie.imdb_rating,
                    "vote_count": movie.vote_count
                }
            })
        return history_list
    async def save(self, data):
        pass
    async def get_similars(self, data):
        pass