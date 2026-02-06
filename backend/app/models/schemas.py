from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# User Schemas
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferences: Optional[dict] = None


class User(UserBase):
    id: int
    preferences: dict = {}
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Settings Schemas
class UserSettingsBase(BaseModel):
    blur_screenshots: bool = True
    enabled_evidence_locker: bool = True
    report_frequency: int = 1


class UserSettingsUpdate(BaseModel):
    blur_screenshots: Optional[bool] = None
    enabled_evidence_locker: Optional[bool] = None
    report_frequency: Optional[int] = None


class UserSettings(UserSettingsBase):
    id: int
    user_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True



# Session Schemas
class SessionBase(BaseModel):
    user_id: int


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    status: Optional[str] = None


class Session(SessionBase):
    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    status: str
    
    class Config:
        from_attributes = True


# Posture Log Schemas
class PostureLogBase(BaseModel):
    session_id: int
    posture_status: str
    neck_angle: Optional[float] = None
    torso_angle: Optional[float] = None
    distance_score: Optional[float] = None
    confidence: Optional[float] = None


class PostureLogCreate(PostureLogBase):
    landmarks: Optional[dict] = None


class PostureLog(PostureLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Pattern Schemas
class PatternBase(BaseModel):
    session_id: int
    time_window_minutes: int
    slouch_percentage: Optional[float] = None
    good_posture_percentage: Optional[float] = None
    too_close_percentage: Optional[float] = None
    longest_slouch_duration_seconds: Optional[int] = None
    total_distance_violations: Optional[int] = None
    sitting_time_minutes: Optional[int] = None


class PatternCreate(PatternBase):
    pass


class Pattern(PatternBase):
    id: int
    analyzed_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


# Alert Schemas
class AlertBase(BaseModel):
    session_id: int
    alert_type: str
    severity: Optional[str] = None
    message: Optional[str] = None


class AlertCreate(AlertBase):
    pass


class Alert(AlertBase):
    id: int
    sent_at: datetime
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Daily Report Schemas
class DailyReportBase(BaseModel):
    user_id: int
    report_date: datetime
    total_sitting_minutes: Optional[int] = None
    good_posture_percentage: Optional[float] = None
    slouch_percentage: Optional[float] = None
    peak_slouch_hour: Optional[int] = None
    total_alerts: Optional[int] = None
    posture_score: Optional[int] = None
    report_data: Optional[dict] = None


class DailyReportCreate(DailyReportBase):
    pass


class DailyReport(DailyReportBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# API Response Schemas
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Message(BaseModel):
    message: str
