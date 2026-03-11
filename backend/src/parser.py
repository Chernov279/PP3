import asyncio

import httpx
from typing import List, Dict, Any, Optional

from backend.src.config import settings


async def fetch_data(url: str):
    headers = {
        "X-API-KEY": settings.API_KEY,
        "accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

    return data

async def fetch_film_data(
    film_id: int
) -> List[Dict[str, Any]]:
    """
    Получает список похожих фильмов для указанного film_id через API Кинопоиска.
    Возвращает список элементов items.
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{film_id}"
    data = await fetch_data(url)
    return data

async def fetch_similar_films(
    film_id: int
) -> List[Dict[str, Any]]:
    """
    Получает список похожих фильмов для указанного film_id через API Кинопоиска.
    Возвращает список элементов items.
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v2.2/films/{film_id}/similars"
    data = await fetch_data(url)
    return data.get("items", [])

async def fetch_search_films(
    q: str,
    page: int = 1
) -> List[Dict[str, Any]]:
    """
    Получает список похожих фильмов для указанного film_id через API Кинопоиска.
    Возвращает список элементов items.
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword={q}&page={page}"
    data = await fetch_data(url)
    return data.get("films", [])

async def fetch_search_persons(
    q: str,
    page: int = 1
) -> List[Dict[str, Any]]:
    """
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v1/persons?name={q}&page={page}"
    data = await fetch_data(url)
    return data.get("items", [])


async def fetch_person_by_id(
    id: int
) -> Dict[str, Any]:
    """
    """
    url = f"https://kinopoiskapiunofficial.tech/api/v1/staff/{id}"
    data = await fetch_data(url)
    return data