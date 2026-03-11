"""add favorite tables

Revision ID: 74e661c04496
Revises: 33feac39b651
Create Date: 2026-03-10 15:44:01.435530

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74e661c04496'
down_revision: Union[str, Sequence[str], None] = '33feac39b651'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table('favorite_movies',
        sa.Column('user_id', sa.Integer(), primary_key=True),
        sa.Column('movie_id', sa.Integer(), primary_key=True)
    )
    op.create_table('favorite_persons',
        sa.Column('user_id', sa.Integer(), primary_key=True),
        sa.Column('person_id', sa.Integer(), primary_key=True)
    )

def downgrade():
    op.drop_table('favorite_persons')
    op.drop_table('favorite_movies')