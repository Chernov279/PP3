"""Favorite FK Tables

Revision ID: a97c1d0e3c16
Revises: 68313c6a1733
Create Date: 2026-09-13 23:01:59.877742

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a97c1d0e3c16'
down_revision: Union[str, Sequence[str], None] = '68313c6a1733'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============================================
    # favorite_genres
    # ============================================
    op.create_table(
        "favorite_genres",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("genre_id", sa.Integer(), primary_key=True, nullable=False),
    )

    # ============================================
    # favorite_movies
    # ============================================
    op.create_table(
        "favorite_movies",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
    )

    # ============================================
    # favorite_persons
    # ============================================
    op.create_table(
        "favorite_persons",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("person_id", sa.Integer(), primary_key=True, nullable=False),
    )
    pass


def downgrade() -> None:
    # ============================================
    # favorite_persons
    # ============================================
    op.drop_table("favorite_persons")

    # ============================================
    # favorite_movies
    # ============================================
    op.drop_table("favorite_movies")

    # ============================================
    # favorite_genres
    # ============================================
    op.drop_table("favorite_genres")
    pass
