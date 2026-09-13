from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.sql import operators

from backend.src.api.films.repository import MovieRepository
from backend.src.models.favorite_movies import FavoriteMovies
from backend.src.models.models import Genre, Movie, MovieGenre
from backend.src.parser import fetch_search_films, fetch_similar_films, fetch_film_data
class FilmService:

    def __init__(self, db_session: AsyncSession):
        self._db_session = db_session
        self._repo = MovieRepository(db_session)

    async def get_film(self, film_id: int):
        film = await self._repo.get_by_id(film_id)
        if not film: 
            film = await fetch_film_data(film_id)
            await self._repo.save(film)
        return film
    
    async def search_film(self, q: str | None = None, page: int = 1, limit: int = 10):
        if q is None:
            return []
        films = await fetch_search_films(q, page)
        return films


    async def db_search_film(
            self, q: str | None = None,
            page: int = 1,
            limit: int = 10,
            sort: str | None = None,
            order: str = 'desc'
        ):
        if q is None:
            return []
        
        search_query = func.websearch_to_tsquery('russian', q)

        query = select(Movie).where(
            Movie.search_vector.op('@@')(search_query)
        )

        if sort and sort in ('kp_rating', 'release_date', 'imdb_rating'):
            sort_column = getattr(Movie, sort)
            if order == 'asc':
                query = query.order_by(sort_column.asc())
            else:
                query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(
                func.ts_rank(Movie.search_vector, search_query).desc()
            )
        query = query.limit(limit).offset((page - 1) * limit)

        results = await self._db_session.execute(query)
        return results.scalars().all()
    

    async def get_film_similars(self, film_id: int, limit: int = 10, page: int = 1):
        film = await self._repo.get_similars(film_id)
        if not film: 
            film = await fetch_similar_films(film_id)
            await self._repo.save(film)
        return film

    async def get_film_genres(self, film_id: int):
        query = select(Genre).join(MovieGenre, Genre.id == MovieGenre.genre_id).where(MovieGenre.movie_id == film_id)
        
        genres = await self._db_session.execute(query)
        return genres.scalars().all()
    
    async def get_all_genres(self, limit: int = 10, page: int = 1):
        

        query = select(Genre).limit(limit).offset((page - 1) * limit)

        genres = await self._db_session.execute(query)
        return genres.scalars().all()
    
    async def get_favorite_movies(self, user_id: int, limit: int = 10, page: int = 1):
        """Возвращает список фильмов, добавленных пользователем в избранное."""
        query = (select(Movie)
                    .join(FavoriteMovies, Movie.id == FavoriteMovies.movie_id)
                    .where(user_id == FavoriteMovies.user_id)
                    .limit(limit)
                    .offset((page - 1) * limit)
                    # .order_by(Movie.created_at.desc())
        )
        result = await self._db_session.execute(query)
        return result.scalars().all()

    async def add_to_favorites(self, movie_id: int, user_id: int) -> dict:
        """Добавляет фильм в избранное пользователя."""
        stmt = select(FavoriteMovies).where(
            FavoriteMovies.user_id == user_id,
            FavoriteMovies.movie_id == movie_id
        )
        existing = await self._db_session.execute(stmt)
        if existing.scalar_one_or_none() is None:
            stmt = select(Movie).where(
                FavoriteMovies.movie_id == movie_id
            )
            fav = FavoriteMovies(user_id=user_id, movie_id=movie_id)
            self._db_session.add(fav)
            await self._db_session.commit()
        return {"detail": "Movie added to favorites"}

    async def remove_from_favorites(self, movie_id: int, user_id: int) -> dict:
        """Удаляет фильм из избранного."""
        stmt = delete(FavoriteMovies).where(
            FavoriteMovies.user_id == user_id,
            FavoriteMovies.movie_id == movie_id
        )
        await self._db_session.execute(stmt)
        await self._db_session.commit()
        return {"detail": "Movie removed from favorites"}