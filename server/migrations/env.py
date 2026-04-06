import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 1. Add the server directory to path so we can import our models
sys.path.append(os.getcwd())

# 2. Import SQLModel and your engines/metadata
from sqlmodel import SQLModel
from models import auth_engine, procurement_engine

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Set the target metadata. 
# Since both Auth and Procurement models use SQLModel, they share the same metadata object.
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # We prioritize the main procurement database for migrations
    url = os.getenv("DATABASE_URL", "sqlite:///./procurement.db")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Use the existing connectable from our procurement engine
    connectable = procurement_engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # We skip the User table if this is specifically the procurement DB
            # but for simplicity in a single-DB setup, we track everything.
            # Inclusion/Exclusion logic can be added here if schemas are used.
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
