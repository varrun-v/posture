from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import database, schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID."""
    db_user = db.query(database.User).filter(database.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/", response_model=List[schemas.User])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all users."""
    users = db.query(database.User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}/settings", response_model=schemas.UserSettings)
def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    """Get user settings (auto-create if missing)."""
    settings = db.query(database.UserSettings).filter(database.UserSettings.user_id == user_id).first()
    if not settings:
        # Auto-create defaults
        settings = database.UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/{user_id}/settings", response_model=schemas.UserSettings)
def update_user_settings(user_id: int, settings_in: schemas.UserSettingsUpdate, db: Session = Depends(get_db)):
    """Update user settings."""
    settings = db.query(database.UserSettings).filter(database.UserSettings.user_id == user_id).first()
    if not settings:
         # Should verify user exists first, but for now auto-create works
        settings = database.UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
    
    update_data = settings_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings
