from fastapi import APIRouter, Depends, Query
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.persons.service import PersonService
from backend.src.api.auth.dependencies import get_token_sub_optional, get_token_sub_required
from backend.src.database.connection import get_db_session


persons = APIRouter(prefix="/persons", tags=["persons"])

async def get_person_service(
    session: AsyncSession = Depends(get_db_session),
) -> PersonService:
    return PersonService(session)


@persons.get("/search")
async def search_persons(
    user_id = Depends(get_token_sub_optional),
    person_service = Depends(get_person_service),
    query: str = Query(min_length=1, max_length=50),
    page: int = 1
):
    return await person_service.search_persons(query, page)


@persons.get("/favorite")
async def get_favorites(
    user_id = Depends(get_token_sub_required),
    person_service = Depends(get_person_service),
):
    return await person_service.get_favorite_persons(user_id)

@persons.post("/favorite/{person_id}")
async def add_person_favorite(
    person_id: int,
    user_id = Depends(get_token_sub_required),
    person_service = Depends(get_person_service),
):
    return await person_service.add_to_favorite(person_id, user_id)

@persons.delete("/favorite/{person_id}")
async def delete_person_favorite(
    person_id: int,
    user_id = Depends(get_token_sub_required),
    person_service = Depends(get_person_service),
):
    return await person_service.remove_from_favorite(person_id, user_id)

@persons.get("/{person_id}")
async def get_person(
    person_id: int,
    user_id = Depends(get_token_sub_optional),
    person_service = Depends(get_person_service),
):
    return await person_service.get_person(person_id)