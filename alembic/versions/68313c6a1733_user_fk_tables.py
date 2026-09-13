"""User FK Tables

Revision ID: 68313c6a1733
Revises: b26dfac737ba
Create Date: 2026-09-13 22:58:09.226290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '68313c6a1733'
down_revision: Union[str, Sequence[str], None] = 'b26dfac737ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        # ============================================
    # refresh_tokens (FK на users.id)
    # ============================================
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("device_fingerprint", sa.String(255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index(
        "ix_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )

    # ============================================
    # reviews
    # ============================================
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])
    op.create_index("ix_reviews_user_id", "reviews", ["user_id"])
    op.create_index("ix_reviews_movie_id", "reviews", ["movie_id"])

    # ============================================
    # watch_history (UNIQUE user_id + movie_id)
    # ============================================
    op.create_table(
        "watch_history",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("movie_id", sa.Integer(), nullable=False),
        sa.Column("watched_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column("watch_duration", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.UniqueConstraint("user_id", "movie_id", name="uq_user_movie"),
    )
    op.create_index("ix_watch_history_id", "watch_history", ["id"])
    op.create_index("ix_watch_history_user_id", "watch_history", ["user_id"])
    op.create_index("ix_watch_history_movie_id", "watch_history", ["movie_id"])

    # ============================================
    # content_features
    # ============================================
    op.create_table(
        "content_features",
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("genre_vector", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("actor_vector", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("director_vector", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("keyword_vector", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("embedding", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )

    # ============================================
    # user_preferences
    # ============================================
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("genre_weights", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("actor_weights", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("director_weights", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("rating_tendency", sa.Float(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # ============================================
    # similar_movies
    # ============================================
    op.create_table(
        "similar_movies",
        sa.Column("movie_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("similar_movies", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    # ============================================
    # similar_movies
    # ============================================
    op.drop_table("similar_movies")

    # ============================================
    # user_preferences
    # ============================================
    op.drop_table("user_preferences")

    # ============================================
    # content_features
    # ============================================
    op.drop_table("content_features")

    # ============================================
    # watch_history
    # ============================================
    op.drop_index("ix_watch_history_movie_id", table_name="watch_history")
    op.drop_index("ix_watch_history_user_id", table_name="watch_history")
    op.drop_index("ix_watch_history_id", table_name="watch_history")
    op.drop_table("watch_history")

    # ============================================
    # reviews
    # ============================================
    op.drop_index("ix_reviews_movie_id", table_name="reviews")
    op.drop_index("ix_reviews_user_id", table_name="reviews")
    op.drop_index("ix_reviews_id", table_name="reviews")
    op.drop_table("reviews")

    # ============================================
    # refresh_tokens (FK на users — дропаем до users)
    # ============================================
    op.drop_index("ix_refresh_tokens_token_hash", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
 