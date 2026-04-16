"""Add missing columns rejection_reason and ledger_url

Revision ID: 778899aabbcc
Revises: 64092bfce2e0
Create Date: 2026-04-16 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '778899aabbcc'
down_revision: Union[str, Sequence[str], None] = '64092bfce2e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add rejection_reason to procurementrequest
    op.add_column('procurementrequest', sa.Column('rejection_reason', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # Add ledger_url to pettycash
    op.add_column('pettycash', sa.Column('ledger_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

def downgrade() -> None:
    op.drop_column('pettycash', 'ledger_url')
    op.drop_column('procurementrequest', 'rejection_reason')
