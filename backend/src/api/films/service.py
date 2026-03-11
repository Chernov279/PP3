from tkinter import N

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.films.repository import MovieRepository
from backend.src.models.models import Genre, MovieGenre
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
    
    async def search_film(self, q: str | None = None, page: int = 1):
        if q is None:
            return []
        films = await fetch_search_films(q, page)
        return films



    async def get_film_similars(self, film_id: int):
        film = await self._repo.get_similars(film_id)
        if not film: 
            film = await fetch_similar_films(film_id)
            await self._repo.save(film)
        return film

    async def get_film_genres(self, film_id: int):
        query = select(Genre).join(MovieGenre, Genre.id == MovieGenre.genre_id).where(MovieGenre.movie_id == film_id)
        
        genres = await self._db_session.execute(query)
        return genres.scalars().all()
    
    async def get_all_genres(self):
        query = select(Genre)
        genres = await self._db_session.execute(query)
        return genres.scalars().all()