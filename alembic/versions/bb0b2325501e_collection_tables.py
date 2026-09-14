"""Collection Tables

Revision ID: bb0b2325501e
Revises: a97c1d0e3c16
Create Date: 2026-09-15 01:56:14.262888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb0b2325501e'
down_revision: Union[str, Sequence[str], None] = 'a97c1d0e3c16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "collections",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_collections_id", "collections", ["id"])
    op.create_index("ix_collections_user_id", "collections", ["user_id"])

    op.create_table(
        "collection_movies",
        sa.Column(
            "collection_id",
            sa.Integer(),
            sa.ForeignKey("collections.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "movie_id",
            sa.Integer(),
            sa.ForeignKey("movies.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("added_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("collection_id", "movie_id", name="uq_collection_movie"),
    )


def downgrade() -> None:
    op.drop_table("collection_movies")

    op.drop_index("ix_collections_user_id", table_name="collections")
    op.drop_index("ix_collections_id", table_name="collections")
    op.drop_table("collections")