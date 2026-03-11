from datetime import date, datetime
from email.policy import HTTP
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, delete

from backend.src.models.favorite_persons import FavoritePersons
from backend.src.models.models import Actor
from backend.src.parser import fetch_person_by_id, fetch_search_persons


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

class PersonService:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    def _map_parse_person(self, person_data: dict) -> Actor:
        actor = Actor(
            id=person_data["personId"],
            name_ru=person_data.get("nameRu"),
            name_en=person_data.get("nameEn"),
            birth_date=_parse_date(person_data.get("birthday")),
            death_date=_parse_date(person_data.get("death")),
            birthplace=person_data.get("birthplace"),
            deathplace=person_data.get("deathplace"),
            growth=person_data.get("growth"),
            poster_url=person_data.get("posterUrl"),
            profession=person_data.get("profession"),
            facts=(person_data.get("facts") or []) or None,          
            films=(person_data.get("films") or [])[:5] or None,        
            
        )
        return actor

    async def _get_actor_and_create_if_not_exist(self, person_id: int) -> Actor:
        db_person = await self.session.execute(select(Actor).where(Actor.id == person_id))
        actor = db_person.scalars().first()
        if not actor:
            fetched_actor = await fetch_person_by_id(person_id)
            if fetched_actor:
                actor = self._map_parse_person(fetched_actor)
                self.session.add(actor)
                await self.session.commit()
            else:
                raise HTTPException(status_code=404, detail="Actor not found")
        return actor
    

    async def search_persons(self, query: str, page: int = 1):
        persons = await fetch_search_persons(query, page)
        return persons
        
    async def get_person(self, person_id: int):
        actor = await self._get_actor_and_create_if_not_exist(person_id)
        return actor
    
    async def add_to_favorite(self, person_id: int, user_id: int):
    
        actor = await self._get_actor_and_create_if_not_exist(person_id)

        favorite = FavoritePersons(user_id=user_id, person_id=person_id)
        self.session.add(favorite)
        try:
            await self.session.commit()
            return True
        except IntegrityError:
            # Запись уже существует (дубликат первичного ключа)
            await self.session.rollback()
            return True  # или False, если нужно различать "уже было"
        except Exception:
            await self.session.rollback()
            return False
        
    async def remove_from_favorite(self, person_id: int, user_id: int) -> bool:
        """
        Удаляет актёра из избранного пользователя.
        Возвращает True, если запись была удалена, False если не найдена.
        """
        stmt = delete(FavoritePersons).where(
            FavoritePersons.user_id == user_id,
            FavoritePersons.person_id == person_id
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0  # удалено строк > 0


    async def get_favorite_persons(self, user_id: int):
        stmt = (
            select(Actor)
            .join(FavoritePersons, FavoritePersons.person_id == Actor.id)
            .where(FavoritePersons.user_id == user_id)
            .order_by(Actor.popularity.desc().nulls_last())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()