from datetime import datetime, timezone
from unittest.mock import AsyncMock, Mock

import pytest

from backend.tests.factories import make_collection, make_movie


pytestmark = pytest.mark.asyncio


# ============================================================
# POST /collections
# ============================================================


async def test_create_collection_success(
    unit_client,
    mock_db_session,
    user_fixture,
):
    """201 + корректное тело; add/commit/refresh вызваны по одному разу."""
    fixed_created_at = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)

    async def fake_refresh(obj):
        # имитируем то, что делает БД: проставляет id и timestamps
        obj.id = 42
        obj.created_at = fixed_created_at
        obj.updated_at = fixed_created_at

    mock_db_session.add = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock(side_effect=fake_refresh)

    response = await unit_client.post(
        "/collections",
        json={
            "title": "Классика",
            "description": "Лучшее",
            "is_public": True,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 42
    assert body["user_id"] == user_fixture.id
    assert body["title"] == "Классика"
    assert body["description"] == "Лучшее"
    assert body["is_public"] is True

    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_awaited_once()
    mock_db_session.refresh.assert_awaited_once()

    # объект, который попал в add, содержит правильные поля
    added_obj = mock_db_session.add.call_args.args[0]
    assert added_obj.user_id == user_fixture.id
    assert added_obj.title == "Классика"
    assert added_obj.is_public is True


async def test_create_collection_minimal_payload(
    unit_client,
    mock_db_session,
    user_fixture,
):
    """description и is_public опциональны: description=None, is_public=False."""
    fixed_now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)

    async def fake_refresh(obj):
        obj.id = 7
        obj.created_at = fixed_now
        obj.updated_at = fixed_now

    mock_db_session.add = AsyncMock()
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock(side_effect=fake_refresh)

    response = await unit_client.post(
        "/collections",
        json={"title": "Минимум"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["description"] is None
    assert body["is_public"] is False


async def test_create_collection_empty_title_returns_422(unit_client):
    """Пустой title режется Pydantic-валидатором до вызова сервиса."""
    response = await unit_client.post(
        "/collections",
        json={"title": "", "is_public": False},
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"][-1] == "title" for e in errors)


async def test_create_collection_title_too_long_returns_422(unit_client):
    """title > 255 символов → 422."""
    response = await unit_client.post(
        "/collections",
        json={"title": "x" * 256},
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"][-1] == "title" for e in errors)


# ============================================================
# GET /collections/my
# ============================================================


def _paginated_execute_mock(items: list, total: int) -> AsyncMock:
    """
    Сервис зовёт execute дважды: сначала COUNT(*), потом выборку.
    Возвращаем AsyncMock с side_effect, который на первый вызов
    отдаёт total, на второй — items.
    """
    count_result = Mock()
    count_result.scalar_one = Mock(return_value=total)

    items_result = Mock()
    items_result.scalars = Mock(
        return_value=Mock(all=Mock(return_value=items))
    )

    return AsyncMock(side_effect=[count_result, items_result])


async def test_list_my_collections_success(
    unit_client,
    mock_db_session,
    user_fixture,
):
    """Свои коллекции: 200, две штуки в items, правильные метаданные."""
    collections = [
        make_collection(collection_id=1, user_id=user_fixture.id, title="Первая"),
        make_collection(collection_id=2, user_id=user_fixture.id, title="Вторая"),
    ]
    mock_db_session.execute = _paginated_execute_mock(collections, total=2)

    response = await unit_client.get("/collections/my")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert body["pages"] == 1
    assert len(body["items"]) == 2
    assert body["items"][0]["title"] == "Первая"
    assert body["items"][1]["title"] == "Вторая"


async def test_list_my_collections_empty(
    unit_client,
    mock_db_session,
):
    """Пустой список: total=0, pages=0, items=[]."""
    mock_db_session.execute = _paginated_execute_mock([], total=0)

    response = await unit_client.get("/collections/my")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["items"] == []
    assert body["pages"] == 0


async def test_list_my_collections_pagination(
    unit_client,
    mock_db_session,
    user_fixture,
):
    """page=2, size=1 → pages считается верно, offset учитывается."""
    items = [make_collection(collection_id=2, user_id=user_fixture.id)]
    mock_db_session.execute = _paginated_execute_mock(items, total=5)

    response = await unit_client.get("/collections/my?page=2&size=1")

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 2
    assert body["pages"] == 5
    assert body["total"] == 5
    assert len(body["items"]) == 1


async def test_list_my_collections_invalid_page(unit_client):
    """page=0 запрещён Query(ge=1) → 422."""
    response = await unit_client.get("/collections/my?page=0")
    assert response.status_code == 422


async def test_list_my_collections_size_too_large(unit_client):
    """size=200 запрещён Query(le=100) → 422."""
    response = await unit_client.get("/collections/my?size=200")
    assert response.status_code == 422


# ============================================================
# GET /collections/public
# ============================================================


async def test_list_public_collections_success(
    anon_client,
    mock_db_session,
):
    """Публичный эндпоинт работает без авторизации."""
    collections = [
        make_collection(collection_id=10, user_id=99, is_public=True),
        make_collection(collection_id=11, user_id=77, is_public=True),
    ]
    mock_db_session.execute = _paginated_execute_mock(collections, total=2)

    response = await anon_client.get("/collections/public")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2
    assert all(item["is_public"] is True for item in body["items"])


async def test_list_public_collections_empty(anon_client, mock_db_session):
    mock_db_session.execute = _paginated_execute_mock([], total=0)

    response = await anon_client.get("/collections/public")

    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_list_public_collections_pagination(
    anon_client,
    mock_db_session,
):
    items = [make_collection(collection_id=20, user_id=1, is_public=True)]
    mock_db_session.execute = _paginated_execute_mock(items, total=7)

    response = await anon_client.get("/collections/public?page=3&size=2")

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 3
    assert body["pages"] == 4  # ceil(7/2) = 4
    assert body["total"] == 7

def _get_one_with_movies_mock(collection, movies: list):
    """
    get_one делает scalar_one_or_none, get_movies — scalars().all().
    Возвращаем side_effect с двумя разными моками.
    """
    collection_result = Mock()
    collection_result.scalar_one_or_none = Mock(return_value=collection)

    movies_result = Mock()
    movies_result.scalars = Mock(
        return_value=Mock(all=Mock(return_value=movies))
    )

    return AsyncMock(side_effect=[collection_result, movies_result])

# ============================================================
# GET /collections/search
# ============================================================


async def test_search_collections_success(
    anon_client,
    mock_db_session,
):
    """Поиск по q возвращает 200 и items."""
    items = [
        make_collection(collection_id=1, user_id=99, is_public=True, title="Космос"),
        make_collection(collection_id=2, user_id=98, is_public=True, title="Космические войны"),
    ]
    mock_db_session.execute = _paginated_execute_mock(items, total=2)

    response = await anon_client.get("/collections/search?q=косм")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2


async def test_search_collections_empty(anon_client, mock_db_session):
    mock_db_session.execute = _paginated_execute_mock([], total=0)

    response = await anon_client.get("/collections/search?q=zzzznothing")

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


async def test_search_collections_missing_q(anon_client):
    """Без q — 422, потому что q обязателен (Query(...))."""
    response = await anon_client.get("/collections/search")
    assert response.status_code == 422


async def test_search_collections_empty_q(anon_client):
    """q="" — 422 из-за min_length=1."""
    response = await anon_client.get("/collections/search?q=")
    assert response.status_code == 422


async def test_search_collections_pagination(
    anon_client,
    mock_db_session,
):
    items = [make_collection(collection_id=1, user_id=1, is_public=True)]
    mock_db_session.execute = _paginated_execute_mock(items, total=13)

    response = await anon_client.get("/collections/search?q=test&page=2&size=5")

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 2
    assert body["pages"] == 3   # ceil(13/5)
    assert body["total"] == 13


async def test_search_collections_only_public_false(
    unit_client,
    mock_db_session,
    user_fixture,
):
    """only_public=false тоже валидный запрос."""
    items = [make_collection(collection_id=1, user_id=user_fixture.id, is_public=False)]
    mock_db_session.execute = _paginated_execute_mock(items, total=1)

    response = await unit_client.get("/collections/search?q=private&only_public=false")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1

# ============================================================
# GET /collections/{collection_id}
# ============================================================


async def test_get_collection_owner_ok(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Владелец видит свою приватную коллекцию с фильмами."""
    movies = [make_movie(movie_id=1), make_movie(movie_id=2)]
    mock_db_session.execute = _get_one_with_movies_mock(collection_fixture, movies)

    response = await unit_client.get(f"/collections/{collection_fixture.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == collection_fixture.id
    assert body["title"] == collection_fixture.title
    assert len(body["movies"]) == 2
    assert body["movies"][0]["id"] == 1
    assert body["movies"][1]["id"] == 2


async def test_get_collection_public_anon_ok(
    anon_client,
    mock_db_session,
    public_collection_fixture,
):
    """Публичная коллекция доступна без авторизации."""
    mock_db_session.execute = _get_one_with_movies_mock(public_collection_fixture, [])

    response = await anon_client.get(f"/collections/{public_collection_fixture.id}")

    assert response.status_code == 200
    body = response.json()
    assert body["is_public"] is True
    assert body["movies"] == []


async def test_get_collection_public_other_user_ok(
    unit_client,
    mock_db_session,
    public_collection_fixture,
):
    """Публичную чужую коллекцию видит любой авторизованный."""
    mock_db_session.execute = _get_one_with_movies_mock(public_collection_fixture, [])

    response = await unit_client.get(f"/collections/{public_collection_fixture.id}")

    assert response.status_code == 200


async def test_get_collection_private_other_user_forbidden(
    unit_client,
    mock_db_session,
    collection_of_other_user_fixture,
):
    """Чужая приватная — 403."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_of_other_user_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.get(f"/collections/{collection_of_other_user_fixture.id}")

    assert response.status_code == 403
    assert "private" in response.text.lower()


async def test_get_collection_not_found(unit_client, mock_db_session):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=None)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.get("/collections/9999")

    assert response.status_code == 404

# ============================================================
# PATCH /collections/{collection_id}
# ============================================================


async def test_update_collection_title_ok(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Владелец меняет title — 200, title обновился."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    async def fake_refresh(obj):
        # сервис вызывает commit + refresh; реальная БД обновила бы updated_at
        return None

    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock(side_effect=fake_refresh)

    response = await unit_client.patch(
        f"/collections/{collection_fixture.id}",
        json={"title": "Новое название"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Новое название"
    assert body["is_public"] == collection_fixture.is_public  # не меняли — осталось прежним

    mock_db_session.commit.assert_awaited_once()
    mock_db_session.refresh.assert_awaited_once()


async def test_update_collection_is_public_only(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """PATCH только с is_public не трогает title."""
    original_title = collection_fixture.title

    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()

    response = await unit_client.patch(
        f"/collections/{collection_fixture.id}",
        json={"is_public": True},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["is_public"] is True
    assert body["title"] == original_title


async def test_update_collection_empty_body(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Пустое тело — ничего не меняется, но ответ 200 и commit/refresh вызваны."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)
    mock_db_session.commit = AsyncMock()
    mock_db_session.refresh = AsyncMock()

    response = await unit_client.patch(
        f"/collections/{collection_fixture.id}",
        json={},
    )

    assert response.status_code == 200
    mock_db_session.commit.assert_awaited_once()


async def test_update_collection_invalid_title(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """title="" ловится Pydantic — 422, до сервиса не доходит."""
    response = await unit_client.patch(
        f"/collections/{collection_fixture.id}",
        json={"title": ""},
    )

    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any(e["loc"][-1] == "title" for e in errors)


async def test_update_collection_title_too_long(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    response = await unit_client.patch(
        f"/collections/{collection_fixture.id}",
        json={"title": "x" * 256},
    )
    assert response.status_code == 422


async def test_update_collection_not_found(unit_client, mock_db_session):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=None)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.patch(
        "/collections/9999",
        json={"title": "X"},
    )

    assert response.status_code == 404
    mock_db_session.commit.assert_not_awaited()


async def test_update_collection_other_user_forbidden(
    unit_client,
    mock_db_session,
    collection_of_other_user_fixture,
):
    """Чужая коллекция — 403, никаких изменений и коммитов."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_of_other_user_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.patch(
        f"/collections/{collection_of_other_user_fixture.id}",
        json={"title": "Взлом"},
    )

    assert response.status_code == 403
    mock_db_session.commit.assert_not_awaited()
    mock_db_session.refresh.assert_not_awaited()

# ============================================================
# DELETE /collections/{collection_id}
# ============================================================


async def test_delete_collection_owner_ok(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Владелец удаляет свою коллекцию — 204, commit вызван."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)
    mock_db_session.delete = AsyncMock()
    mock_db_session.commit = AsyncMock()

    response = await unit_client.delete(f"/collections/{collection_fixture.id}")

    assert response.status_code == 204
    assert response.content == b""

    mock_db_session.delete.assert_awaited_once_with(collection_fixture)
    mock_db_session.commit.assert_awaited_once()


async def test_delete_collection_not_found(unit_client, mock_db_session):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=None)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.delete("/collections/9999")

    assert response.status_code == 404
    mock_db_session.delete.assert_not_awaited()
    mock_db_session.commit.assert_not_awaited()


async def test_delete_collection_other_user_forbidden(
    unit_client,
    mock_db_session,
    collection_of_other_user_fixture,
):
    """Чужую коллекцию удалить нельзя — 403, в БД ничего не меняется."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_of_other_user_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.delete(
        f"/collections/{collection_of_other_user_fixture.id}"
    )

    assert response.status_code == 403
    mock_db_session.delete.assert_not_awaited()
    mock_db_session.commit.assert_not_awaited()

    # ============================================================
# POST /collections/{collection_id}/movies/{movie_id}
# ============================================================


def _collection_and_movie_mock(collection, movie_exists: bool):
    """
    add_movie делает 3 запроса в БД:
      1) select(Collection) → scalar_one_or_none
      2) select(Movie.id)   → scalar_one_or_none
      3) select(CollectionMovie) → scalar_one_or_none
    Возвращаем side_effect списком из трёх моков.
    """
    coll_result = Mock()
    coll_result.scalar_one_or_none = Mock(return_value=collection)

    movie_result = Mock()
    movie_result.scalar_one_or_none = Mock(return_value=(1 if movie_exists else None))

    link_result = Mock()
    link_result.scalar_one_or_none = Mock(return_value=None)

    return AsyncMock(side_effect=[coll_result, movie_result, link_result])


async def test_add_movie_success(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Владелец добавляет фильм — 204, add/commit вызваны."""
    mock_db_session.execute = _collection_and_movie_mock(collection_fixture, movie_exists=True)
    mock_db_session.add = Mock()
    mock_db_session.commit = AsyncMock()

    response = await unit_client.post(
        f"/collections/{collection_fixture.id}/movies/42",
    )

    assert response.status_code == 204
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_awaited_once()

    added_link = mock_db_session.add.call_args.args[0]
    assert added_link.collection_id == collection_fixture.id
    assert added_link.movie_id == 42


async def test_add_movie_collection_not_found(unit_client, mock_db_session):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=None)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.post("/collections/9999/movies/1")

    assert response.status_code == 404
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_awaited()


async def test_add_movie_not_owner_forbidden(
    unit_client,
    mock_db_session,
    collection_of_other_user_fixture,
):
    """Чужая приватная коллекция — 403, ничего не пишется."""
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_of_other_user_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.post(
        f"/collections/{collection_of_other_user_fixture.id}/movies/1",
    )

    assert response.status_code == 403
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_awaited()


async def test_add_movie_not_found(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Фильма с таким id нет — 404, ничего не пишется."""
    mock_db_session.execute = _collection_and_movie_mock(collection_fixture, movie_exists=False)

    response = await unit_client.post(
        f"/collections/{collection_fixture.id}/movies/9999",
    )

    assert response.status_code == 404
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_awaited()


async def test_add_movie_already_in_collection(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Фильм уже в коллекции — 409, второй раз не добавляем."""
    coll_result = Mock()
    coll_result.scalar_one_or_none = Mock(return_value=collection_fixture)

    movie_result = Mock()
    movie_result.scalar_one_or_none = Mock(return_value=1)

    link_result = Mock()
    link_result.scalar_one_or_none = Mock(return_value=Mock())  # уже существует

    mock_db_session.execute = AsyncMock(
        side_effect=[coll_result, movie_result, link_result]
    )

    response = await unit_client.post(
        f"/collections/{collection_fixture.id}/movies/1",
    )

    assert response.status_code == 409
    mock_db_session.add.assert_not_called()
    mock_db_session.commit.assert_not_awaited()

# ============================================================
# DELETE /collections/{collection_id}/movies/{movie_id}
# ============================================================


def _remove_movie_mocks(collection, link_exists: bool):
    coll_result = Mock()
    coll_result.scalar_one_or_none = Mock(return_value=collection)

    link_result = Mock()
    link_result.scalar_one_or_none = Mock(return_value=Mock() if link_exists else None)

    return AsyncMock(side_effect=[coll_result, link_result])


async def test_remove_movie_success(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Владелец убирает фильм — 204, delete/commit вызваны."""
    mock_db_session.execute = _remove_movie_mocks(collection_fixture, link_exists=True)
    mock_db_session.delete = AsyncMock()
    mock_db_session.commit = AsyncMock()

    response = await unit_client.delete(
        f"/collections/{collection_fixture.id}/movies/1",
    )

    assert response.status_code == 204
    mock_db_session.delete.assert_awaited_once()
    mock_db_session.commit.assert_awaited_once()


async def test_remove_movie_collection_not_found(unit_client, mock_db_session):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=None)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.delete("/collections/9999/movies/1")

    assert response.status_code == 404
    mock_db_session.delete.assert_not_awaited()
    mock_db_session.commit.assert_not_awaited()


async def test_remove_movie_not_owner_forbidden(
    unit_client,
    mock_db_session,
    collection_of_other_user_fixture,
):
    result = Mock()
    result.scalar_one_or_none = Mock(return_value=collection_of_other_user_fixture)
    mock_db_session.execute = AsyncMock(return_value=result)

    response = await unit_client.delete(
        f"/collections/{collection_of_other_user_fixture.id}/movies/1",
    )

    assert response.status_code == 403
    mock_db_session.delete.assert_not_awaited()
    mock_db_session.commit.assert_not_awaited()


async def test_remove_movie_not_in_collection(
    unit_client,
    mock_db_session,
    collection_fixture,
):
    """Фильма в коллекции нет — 404."""
    mock_db_session.execute = _remove_movie_mocks(collection_fixture, link_exists=False)

    response = await unit_client.delete(
        f"/collections/{collection_fixture.id}/movies/9999",
    )

    assert response.status_code == 404
    mock_db_session.delete.assert_not_awaited()
    mock_db_session.commit.assert_not_awaited()
    