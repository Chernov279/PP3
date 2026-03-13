 """add favorite genres

Revision ID: d4b1b35ca9b2
Revises: 410d75a31874
Create Date: 2026-03-12 15:08:08.883009

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4b1b35ca9b2'
down_revision: Union[str, Sequence[str], None] = '410d75a31874'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('favorite_genres',
        sa.Column('user_id', sa.Integer(), primary_key=True),
        sa.Column('genre_id', sa.Integer(), primary_key=True)
    )
    pass


def downgrade() -> None:
    op.drop_table('favorite_genres')
    pass