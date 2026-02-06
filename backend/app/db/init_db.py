"""
Database initialization script.
Creates all tables defined in the models and sets up default user.
"""

from app.db.session import engine, Base, SessionLocal
from app.models.database import User, Session, PostureLog, Pattern, Alert, DailyReport


def init_db():
    """
    Create all database tables and initialize with default user.
    This should be run once to initialize the database schema.
    """
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")
    
    # Create default user if not exists
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.id == 1).first()
        if not existing_user:
            default_user = User(
                id=1,
                email="user@posturemonitor.local",
                name="Default User",
                preferences={}
            )
            db.add(default_user)
            db.commit()
            print("✓ Default user created (ID: 1)")
        else:
            print("✓ Default user already exists (ID: 1)")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

