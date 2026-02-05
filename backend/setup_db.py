#!/usr/bin/env python3
"""
Database management script.
Run this to initialize or reset the database.
"""

import sys
from app.db.init_db import init_db


def main():
    print("=" * 50)
    print("Posture Monitor - Database Setup")
    print("=" * 50)
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        print("⚠️  WARNING: This will drop all existing tables!")
        response = input("Are you sure? (yes/no): ")
        if response.lower() != "yes":
            print("Aborted.")
            return
        
        from app.db.session import Base, engine
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ Tables dropped")
    
    init_db()
    print()
    print("=" * 50)
    print("Database setup complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
