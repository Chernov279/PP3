"""Initial migration

Revision ID: 1efe35885281
Revises: 
Create Date: 2026-09-13 15:36:17.384027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '1efe35885281'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================
    # users
    # ============================================
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_kinopoisk_synchronized", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("favorite_genres", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("favorite_actors", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("favorite_directors", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("preferred_languages", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_name", "users", ["name"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ============================================
    # profiles
    # ============================================
    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
    )
    op.create_index("ix_profiles_id", "profiles", ["id"])
    op.create_index("ix_profiles_user_id", "profiles", ["user_id"], unique=True)

    # ============================================
    # genres
    # ============================================
    op.create_table(
        "genres",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
    )
    op.create_index("ix_genres_id", "genres", ["id"])
    op.create_index("ix_genres_name", "genres", ["name"], unique=True)

    # ============================================
    # actors
    # ============================================
    op.create_table(
        "actors",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name_ru", sa.String(), nullable=False),
        sa.Column("name_en", sa.String(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("death_date", sa.Date(), nullable=True),
        sa.Column("birthplace", sa.String(), nullable=True),
        sa.Column("deathplace", sa.String(), nullable=True),
        sa.Column("growth", sa.Integer(), nullable=True),
        sa.Column("poster_url", sa.String(), nullable=True),
        sa.Column("popularity", sa.Float(), nullable=True),
        sa.Column("average_rating", sa.Float(), nullable=True),
        sa.Column("profession", sa.String(), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("facts", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("films", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True),
    )
    op.create_index(
        "idx_actor_search_vector",
        "actors",
        ["search_vector"],
        postgresql_using="gin",
    )

    # ============================================
    # directors
    # ============================================
    op.create_table(
        "directors",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("death_date", sa.Date(), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("style_tags", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("average_rating", sa.Float(), nullable=True),
    )
    pass


def downgrade() -> None:
    # ============================================
    # directors
    # ============================================
    op.drop_table("directors")

    # ============================================
    # actors (с GIN-индексом)
    # ============================================
    op.drop_index("idx_actor_search_vector", table_name="actors")
    op.drop_table("actors")

    # ============================================
    # genres
    # ============================================
    op.drop_index("ix_genres_name", table_name="genres")
    op.drop_index("ix_genres_id", table_name="genres")
    op.drop_table("genres")

    # ============================================
    # profiles
    # ============================================
    op.drop_index("ix_profiles_user_id", table_name="profiles")
    op.drop_index("ix_profiles_id", table_name="profiles")
    op.drop_table("profiles")

    # ============================================
    # users
    # ============================================
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_name", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
    pass
