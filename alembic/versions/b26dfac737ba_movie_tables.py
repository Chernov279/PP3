"""Movie Tables

Revision ID: b26dfac737ba
Revises: 1efe35885281
Create Date: 2026-09-13 15:44:17.981347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b26dfac737ba'
down_revision: Union[str, Sequence[str], None] = '1efe35885281'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     # ============================================
    # movies
    # ============================================
    op.create_table(
        "movies",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("original_title", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("trailer_date", sa.DateTime(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("budget", sa.Integer(), nullable=True),
        sa.Column("revenue", sa.Integer(), nullable=True),
        sa.Column("kp_rating", sa.Float(), nullable=True),
        sa.Column("imdb_rating", sa.Float(), nullable=True),
        sa.Column("metacritic_rating", sa.Float(), nullable=True),
        sa.Column("poster_url", sa.String(), nullable=True),
        sa.Column("vote_count", sa.Integer(), nullable=True),
        sa.Column("popularity", sa.Float(), nullable=True),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("keywords", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("content_score", sa.Float(), nullable=True),
        sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True),
    )
    op.create_index("ix_movies_title", "movies", ["title"])
    op.create_index(
        "idx_movie_search_vector",
        "movies",
        ["search_vector"],
        postgresql_using="gin",
    )

    # ============================================
    # movie_genres (association)
    # ============================================
    op.create_table(
        "movie_genres",
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("genre_id", sa.Integer(), primary_key=True, nullable=False),
    )

    # ============================================
    # movie_actors (association с доп. полями)
    # ============================================
    op.create_table(
        "movie_actors",
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("actor_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("character_name", sa.String(), nullable=True),
        sa.Column("is_lead_role", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_first_plan", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("order", sa.Integer(), nullable=True),
    )

    # ============================================
    # movie_directors (association)
    # ============================================
    op.create_table(
        "movie_directors",
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("director_id", sa.Integer(), primary_key=True, nullable=False),
    )


def downgrade() -> None:
    # ============================================
    # movie_directors
    # ============================================
    op.drop_table("movie_directors")

    # ============================================
    # movie_actors
    # ============================================
    op.drop_table("movie_actors")

    # ============================================
    # movie_genres
    # ============================================
    op.drop_table("movie_genres")

    # ============================================
    # movies (с GIN-индексом)
    # ============================================
    op.drop_index("idx_movie_search_vector", table_name="movies")
    op.drop_index("ix_movies_title", table_name="movies")
    op.drop_table("movies")
