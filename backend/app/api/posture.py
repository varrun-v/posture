from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel

from app.db.session import get_db
from app.models import database, schemas
from app.core.posture_detector import get_detector

router = APIRouter(prefix="/posture", tags=["posture"])


class FrameAnalysisRequest(BaseModel):
    session_id: int
    frame: str  # base64 encoded image


from app.workers.posture_worker import analyze_frame_task

@router.post("/analyze-frame", status_code=202)
async def analyze_frame(request: FrameAnalysisRequest, db: Session = Depends(get_db)):
    """
    Queue a camera frame for async processing.
    The result will be broadcast via WebSocket.
    """
    # Verify session exists and is active
    session = db.query(database.Session).filter(database.Session.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Offload to Celery Worker
    task = analyze_frame_task.delay(request.frame, request.session_id)
    
    return {
        "status": "processing",
        "task_id": str(task.id)
    }


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
    
    # 1. Timeline & Slouch Metrics
    timeline = []
    longest_slouch_streak = 0
    current_slouch_start = None
    total_slouch_duration = 0
    
    # Sort logs by timestamp just in case
    logs.sort(key=lambda x: x.timestamp)
    
    start_time = logs[0].timestamp
    end_time = logs[-1].timestamp
    total_duration = (end_time - start_time) if total_logs > 1 else 0
    
    prev_log = None
    
    for i, log in enumerate(logs):
        # Sampling for Timeline (limit to ~100 points for frontend performance)
        if total_logs < 100 or i % (total_logs // 100) == 0:
             timeline.append({
                 "time": log.timestamp.isoformat(),
                 "status": log.posture_status,
                 "score": 100 if log.posture_status == 'GOOD' else (50 if log.posture_status == 'TOO_CLOSE' else 0)
             })
        
        status_counts[log.posture_status] = status_counts.get(log.posture_status, 0) + 1
        
        # Slouch Duration Logic (Time-weighted)
        if prev_log:
            time_diff = (log.timestamp - prev_log.timestamp).total_seconds()
            
            # Sanity check for huge gaps (e.g. paused session)
            if time_diff < 30: 
                if log.posture_status == 'SLOUCHING':
                    total_slouch_duration += time_diff
                    if current_slouch_start is None:
                        current_slouch_start = log.timestamp
                else:
                    if current_slouch_start:
                        # Streak ended
                        streak_duration = (prev_log.timestamp - current_slouch_start).total_seconds()
                        if streak_duration > longest_slouch_streak:
                            longest_slouch_streak = streak_duration
                        current_slouch_start = None
        
        prev_log = log

    # Handle case where session ends while slouching
    if current_slouch_start:
        streak_duration = (logs[-1].timestamp - current_slouch_start).total_seconds()
        if streak_duration > longest_slouch_streak:
             longest_slouch_streak = streak_duration

    # 2. Trend Analysis (First 25% vs Last 25%)
    cutoff_index = total_logs // 4
    if cutoff_index > 0:
        first_quarter = logs[:cutoff_index]
        last_quarter = logs[-cutoff_index:]
        
        def calculate_score(segment):
            good_count = sum(1 for l in segment if l.posture_status == 'GOOD')
            return (good_count / len(segment)) * 100
            
        start_score = calculate_score(first_quarter)
        end_score = calculate_score(last_quarter)
        
        trend = "improved" if end_score > (start_score + 5) else ("worsened" if end_score < (start_score - 5) else "stable")
    else:
        start_score = 0
        end_score = 0
        trend = "insufficient_data"

    # 3. Overall Score
    good_total = status_counts.get("GOOD", 0)
    overall_score = round((good_total / total_logs) * 100) if total_logs > 0 else 0

    # 4. Recommendations
    recommendations = []
    if longest_slouch_streak > 300: # 5 mins
        recommendations.append("Take a break! Long periods of slouching detected.")
    if trend == "worsened":
        recommendations.append("Fatigue detected. Your posture degraded towards the end.")
    if overall_score > 80:
        recommendations.append("Great job! High consistency.")

    # Calculate session duration (Metadata)
    if session.status == "completed" and session.total_duration_seconds:
        duration_minutes = session.total_duration_seconds / 60
    else:
        duration_minutes = (datetime.utcnow() - session.started_at).total_seconds() / 60
    
    # Calculate percentages (Legacy support)
    posture_breakdown = {
        status: round((count / total_logs) * 100, 2)
        for status, count in status_counts.items()
    }
    
    return {
        "session_id": session_id,
        "total_logs": total_logs,
        "duration_minutes": round(duration_minutes, 2),
        "posture_breakdown": posture_breakdown,
        "status_counts": status_counts,
        "session_status": session.status,
        # Deep Analytics
        "score": overall_score,
        "timeline": timeline,
        "slouch_metrics": {
            "total_duration_seconds": round(total_slouch_duration),
            "longest_streak_seconds": round(longest_slouch_streak)
        },
        "trend": {
            "start_score": round(start_score),
            "end_score": round(end_score),
            "direction": trend
        },
        "recommendations": recommendations
    }
