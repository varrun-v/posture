from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class User(Base):
    """User model for storing user information and preferences."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    preferences = Column(JSON, default={})  # Notification settings, thresholds, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    daily_reports = relationship("DailyReport", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Session(Base):
    """Monitoring session model - one per monitoring period."""
    
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    total_duration_seconds = Column(Integer, nullable=True)
    status = Column(String(20), default="active")  # active, completed, paused
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    posture_logs = relationship("PostureLog", back_populates="session", cascade="all, delete-orphan")
    patterns = relationship("Pattern", back_populates="session", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="session", cascade="all, delete-orphan")


class PostureLog(Base):
    """Real-time posture detection logs."""
    
    __tablename__ = "posture_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    posture_status = Column(String(20), nullable=False, index=True)  # GOOD, SLOUCHING, TOO_CLOSE, NO_PERSON
    neck_angle = Column(Float, nullable=True)
    torso_angle = Column(Float, nullable=True)
    distance_score = Column(Float, nullable=True)  # 0-1 normalized
    confidence = Column(Float, nullable=True)  # MediaPipe confidence
    landmarks = Column(JSON, nullable=True)  # Optional: full pose landmarks
    
    # Relationships
    session = relationship("Session", back_populates="posture_logs")


class Pattern(Base):
    """Periodic pattern analysis results."""
    
    __tablename__ = "patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    analyzed_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    time_window_minutes = Column(Integer, nullable=False)  # e.g., 5, 30, 60
    slouch_percentage = Column(Float, nullable=True)
    good_posture_percentage = Column(Float, nullable=True)
    too_close_percentage = Column(Float, nullable=True)
    longest_slouch_duration_seconds = Column(Integer, nullable=True)
    total_distance_violations = Column(Integer, nullable=True)
    sitting_time_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="patterns")


class Alert(Base):
    """Alerts and notifications sent to users."""
    
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    sent_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    alert_type = Column(String(50), nullable=False)  # SLOUCH_ALERT, BREAK_REMINDER, DISTANCE_WARNING
    severity = Column(String(20), nullable=True)  # low, medium, high
    message = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # Relationships
    session = relationship("Session", back_populates="alerts")


class DailyReport(Base):
    """Daily posture reports and analytics."""
    
    __tablename__ = "daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(DateTime, nullable=False, index=True)
    total_sitting_minutes = Column(Integer, nullable=True)
    good_posture_percentage = Column(Float, nullable=True)
    slouch_percentage = Column(Float, nullable=True)
    peak_slouch_hour = Column(Integer, nullable=True)  # 0-23
    total_alerts = Column(Integer, nullable=True)
    posture_score = Column(Integer, nullable=True)  # 0-100
    report_data = Column(JSON, nullable=True)  # Detailed breakdown
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="daily_reports")


class UserSettings(Base):
    """User configuration for Enterprise features."""
    
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Evidence Locker
    blur_screenshots = Column(Boolean, default=True)  # Privacy First
    enabled_evidence_locker = Column(Boolean, default=True)
    
    # Reporting
    report_frequency = Column(Integer, default=1)  # 1, 2, or 3 times daily
    last_report_sent_at = Column(DateTime, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="settings")

# Update User model to include settings relationship (monkey-patching or manual update required)
# Ideally I would update the User class above, but to avoid replacing the whole file I'll rely on SQLAlchemy's registry 
# or I can update the User class in a separate edit if needed. 

