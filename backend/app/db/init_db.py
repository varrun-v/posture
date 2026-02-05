"""
Database initialization script.
Creates all tables defined in the models.
"""

from app.db.session import engine, Base
from app.models.database import User, Session, PostureLog, Pattern, Alert, DailyReport


def init_db():
    """
    Create all database tables.
    This should be run once to initialize the database schema.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")


if __name__ == "__main__":
    init_db()
