from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models import database, schemas

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=schemas.Session)
def start_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    """Start a new monitoring session."""
    # Verify user exists
    user = db.query(database.User).filter(database.User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has an active session
    active_session = db.query(database.Session).filter(
        database.Session.user_id == session.user_id,
        database.Session.status == "active"
    ).first()
    
    if active_session:
        raise HTTPException(
            status_code=400,
            detail=f"User already has an active session (ID: {active_session.id})"
        )
    
    # Create new session
    db_session = database.Session(
        user_id=session.user_id,
        started_at=datetime.utcnow(),
        status="active"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.post("/{session_id}/stop", response_model=schemas.Session)
def stop_session(session_id: int, db: Session = Depends(get_db)):
    """Stop an active monitoring session."""
    db_session = db.query(database.Session).filter(database.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if db_session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Calculate duration
    db_session.ended_at = datetime.utcnow()
    duration = (db_session.ended_at - db_session.started_at).total_seconds()
    db_session.total_duration_seconds = int(duration)
    db_session.status = "completed"
    
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/{session_id}", response_model=schemas.Session)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get session details."""
    db_session = db.query(database.Session).filter(database.Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session


@router.get("/user/{user_id}", response_model=List[schemas.Session])
def get_user_sessions(
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all sessions for a user."""
    query = db.query(database.Session).filter(database.Session.user_id == user_id)
    
    if status:
        query = query.filter(database.Session.status == status)
    
    sessions = query.order_by(desc(database.Session.started_at)).offset(skip).limit(limit).all()
    return sessions


@router.get("/user/{user_id}/active", response_model=Optional[schemas.Session])
def get_active_session(user_id: int, db: Session = Depends(get_db)):
    """Get user's active session if any."""
    active_session = db.query(database.Session).filter(
        database.Session.user_id == user_id,
        database.Session.status == "active"
    ).first()
    return active_session
