from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.session import get_db
from app.models import database, schemas

router = APIRouter(prefix="/posture", tags=["posture"])


@router.post("/log", response_model=schemas.PostureLog)
def log_posture(posture: schemas.PostureLogCreate, db: Session = Depends(get_db)):
    """Log a posture detection result."""
    # Verify session exists and is active
    session = db.query(database.Session).filter(database.Session.id == posture.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Create posture log
    db_log = database.PostureLog(**posture.model_dump())
    db_log.timestamp = datetime.utcnow()
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.get("/session/{session_id}/current")
def get_current_posture(session_id: int, db: Session = Depends(get_db)):
    """Get the most recent posture status for a session."""
    latest_log = db.query(database.PostureLog).filter(
        database.PostureLog.session_id == session_id
    ).order_by(desc(database.PostureLog.timestamp)).first()
    
    if not latest_log:
        return {"message": "No posture data available for this session"}
    
    # Calculate duration in current state
    duration_seconds = (datetime.utcnow() - latest_log.timestamp).total_seconds()
    
    return {
        "session_id": session_id,
        "current_status": latest_log.posture_status,
        "last_updated": latest_log.timestamp,
        "duration_in_current_state_seconds": int(duration_seconds),
        "neck_angle": latest_log.neck_angle,
        "torso_angle": latest_log.torso_angle,
        "distance_score": latest_log.distance_score,
        "confidence": latest_log.confidence
    }


@router.get("/session/{session_id}/history", response_model=List[schemas.PostureLog])
def get_posture_history(
    session_id: int,
    skip: int = 0,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get posture history for a session."""
    logs = db.query(database.PostureLog).filter(
        database.PostureLog.session_id == session_id
    ).order_by(desc(database.PostureLog.timestamp)).offset(skip).limit(limit).all()
    
    return logs


@router.get("/session/{session_id}/stats")
def get_session_stats(session_id: int, db: Session = Depends(get_db)):
    """Get posture statistics for a session."""
    # Verify session exists
    session = db.query(database.Session).filter(database.Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all logs for this session
    logs = db.query(database.PostureLog).filter(
        database.PostureLog.session_id == session_id
    ).all()
    
    if not logs:
        return {
            "session_id": session_id,
            "total_logs": 0,
            "message": "No posture data available"
        }
    
    # Calculate statistics
    total_logs = len(logs)
    status_counts = {}
    for log in logs:
        status_counts[log.posture_status] = status_counts.get(log.posture_status, 0) + 1
    
    # Calculate percentages
    posture_breakdown = {
        status: round((count / total_logs) * 100, 2)
        for status, count in status_counts.items()
    }
    
    # Calculate session duration
    if session.status == "completed" and session.total_duration_seconds:
        duration_minutes = session.total_duration_seconds / 60
    else:
        duration_minutes = (datetime.utcnow() - session.started_at).total_seconds() / 60
    
    return {
        "session_id": session_id,
        "total_logs": total_logs,
        "duration_minutes": round(duration_minutes, 2),
        "posture_breakdown": posture_breakdown,
        "status_counts": status_counts,
        "session_status": session.status
    }
