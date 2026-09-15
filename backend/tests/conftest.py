import logging
from unittest.mock import AsyncMock
import uuid
from typing import Any, AsyncGenerator, AsyncIterator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.auth.dependencies import get_token_sub_optional
from backend.src.database.connection import get_db_session
from backend.src.main import app
from backend.tests.factories import make_collection, make_movie, make_profile, make_user
from backend.tests.config import test_db_helper


logger = logging.getLogger(__name__)
REGISTER_PATH = ...
LOGIN_PATH = ...


@pytest.fixture(scope="function")
def mock_db_session():
    """Фикстура, возвращающая мок сессии БД."""
    session = AsyncMock()
    return session

@pytest.fixture
def user_fixture():
    return make_user()

@pytest.fixture
def other_user_fixture():
    return make_user(user_id=2)


@pytest.fixture
def profile_fixture():
    return make_profile()

@pytest.fixture
def movie_fixture():
    return make_movie()

@pytest.fixture
def collection_fixture(user_fixture):
    """Своя приватная коллекция."""
    return make_collection(collection_id=1, user_id=user_fixture.id, is_public=False)


@pytest.fixture
def public_collection_fixture(other_user_fixture):
    """Публичная коллекция другого пользователя."""
    return make_collection(
        collection_id=2,
        user_id=other_user_fixture.id,
        title="Публичная",
        is_public=True,
    )

@pytest.fixture
def collection_of_other_user_fixture(other_user_fixture):
    """Чужая приватная коллекция — для проверки 403."""
    return make_collection(
        collection_id=3,
        user_id=other_user_fixture.id,
        is_public=False,
    )

@pytest_asyncio.fixture
async def unit_client(
    mock_db_session: AsyncMock,
    user_fixture,
) -> AsyncIterator[AsyncClient]:
    from backend.src.main import app
    from backend.src.api.auth.dependencies import get_token_sub_required

    async def override_get_db():
        yield mock_db_session

    async def override_user_id() -> int:
        return user_fixture.id

    async def override_optional_user_id() -> int:
        return user_fixture.id

    app.dependency_overrides.clear()
    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_token_sub_required] = override_user_id
    app.dependency_overrides[get_token_sub_optional] = override_optional_user_id

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def anon_client(
    mock_db_session: AsyncMock,
) -> AsyncIterator[AsyncClient]:
    """Клиент без авторизации — для публичных эндпоинтов."""
    from backend.src.main import app
    

    async def override_get_db():
        yield mock_db_session

    app.dependency_overrides.clear()
    app.dependency_overrides[get_db_session] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def engine():
    """Движок базы данных для тестов."""
    engine = test_db_helper.engine

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine):
    """Изолированная сессия для каждого теста."""
    connection = await engine.connect()
    transaction = await connection.begin()

    session = AsyncSession(
        bind=connection,
        expire_on_commit=False,
    )

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """Клиент FastAPI."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db

    async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=30.0
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def debug_response():
    """Фикстура для отладки ответов."""

    def _debug(response, expected_status=None):
        logger.warning(f"URL: {response.url}")
        logger.warning(f"Status Code: {response.status_code}")
        logger.warning(f"Headers: {dict(response.headers)}")
        logger.warning(f"Response Body: {response.text[:500]}")  # Первые 500 символов

        if expected_status and response.status_code != expected_status:
            logger.error(f"Expected {expected_status}, got {response.status_code}")
            logger.error(f"Full response: {response.text}")

    return _debug


@pytest_asyncio.fixture(scope="function")
async def create_user(client: AsyncClient) -> AsyncGenerator:
    """Фабрика для создания тестовых пользователей"""

    created_users = []

    async def factory(**overrides) -> dict[str, Any]:
        """Создает пользователя с уникальными данными"""
        test_id = uuid.uuid4().hex[:8]

        user_data = {
            "name": f"User_{test_id}",
            "email": f"user_{test_id}@example.com",
            "password": "TestPass123!",
            **overrides
        }

        # Регистрация
        register_response = await client.post(REGISTER_PATH, json=user_data)
        assert 200 <= register_response.status_code <= 299 , f"Registration failed: {register_response.text}"

        # Логин для получения токена
        login_response = await client.post(LOGIN_PATH, json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        assert 200 <= login_response.status_code <= 299, f"Login failed: {login_response.text}"

        tokens = login_response.json()

        user_info = {
            "id": register_response.json().get("user_id"),
            "email": user_data["email"],
            "name": user_data["name"],
            "headers": {"Authorization": f"Bearer {tokens['access_token']}"},
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "raw_data": user_data
        }

        created_users.append(user_info)
        return user_info

    yield factory