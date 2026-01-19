from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.auth.repository import UserRepository
from backend.src.profile.schemas import UserProfileOut
from backend.src.users.repository import ProfileRepository


class ProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.profile_repo = ProfileRepository(session)
        self.user_repo = UserRepository(session)
        self.movie_repo = MovieRepository(session)

    async def get_user_profile(self, user_id: int) -> UserProfileOut:
        user = await self.user_repo.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        profile = await self.profile_repo.get_profile_by_user_id(user_id)

        favorite_genres = list(user.favorite_genres.keys()) if user.favorite_genres else []
        favorite_actors = list(user.favorite_actors.keys()) if user.favorite_actors else []

        watched_movies = await self.movie_repo.get_watched_movies_ids(user_id)
        favorite_movies = await self.movie_repo.get_favorite_movies_ids(user_id)

        # Для простоты считаем, что подключение IMDB/КП = наличие favorite_actors/favorite_genres
        imdb_connected = bool(user.favorite_actors)
        kinopoisk_connected = bool(user.favorite_genres)

        return UserProfileOut(
            id=profile.id if profile else 0,
            user_id=user.id,
            favorite_genres=favorite_genres,
            favorite_actors=favorite_actors,
            watched_movies=watched_movies,
            favorite_movies=favorite_movies,
            imdb_connected=imdb_connected,
            kinopoisk_connected=kinopoisk_connected,
            created_at=user.created_at.isoformat(),
            updated_at=user.created_at.isoformat()  # пока нет поля updated_at
        )
