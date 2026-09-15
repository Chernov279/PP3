from datetime import datetime, timezone
from types import SimpleNamespace


def make_user(user_id: int = 1, **kwargs) -> SimpleNamespace:
    defaults = {
        "id": user_id,
        "name": f"user{user_id}",
        "email": f"user{user_id}@example.com",
        "hashed_password": "$2b$12$abcdefghijklmnopqrstuv",
        "is_kinopoisk_synchronized": False,
        "created_at": datetime.now(timezone.utc),
        "favorite_genres": None,
        "favorite_actors": None,
        "favorite_directors": None,
        "preferred_languages": None,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_profile(profile_id: int = 1, user_id: int = 1, **kwargs) -> SimpleNamespace:
    defaults = {
        "id": profile_id,
        "user_id": user_id,
        "bio": None,
        "avatar_url": None,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_movie(movie_id: int = 1, **kwargs) -> SimpleNamespace:
    defaults = {
        "id": movie_id,
        "title": f"Movie {movie_id}",
        "original_title": None,
        "description": None,
        "poster_url": None,
        "release_date": None,
        "kp_rating": 7.5,
        "imdb_rating": 7.0,
        "popularity": 100.0,
        "vote_count": 1000,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def make_collection(collection_id: int = 1, user_id: int = 1, **kwargs) -> SimpleNamespace:
    now = datetime.now(timezone.utc)
    defaults = {
        "id": collection_id,
        "user_id": user_id,
        "title": f"Collection {collection_id}",
        "description": None,
        "is_public": False,
        "created_at": now,
        "updated_at": now,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)