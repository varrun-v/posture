from app.core.celery_app import celery_app
from app.core.posture_detector import get_detector
from app.db.session import SessionLocal
from app.models import database
from datetime import datetime
import redis
import json
import time
import os
import cv2
import numpy as np
import base64

# Connect to Redis (Sync for Celery)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

# Evidence Directory
EVIDENCE_DIR = "/app/data/evidence"
os.makedirs(EVIDENCE_DIR, exist_ok=True)

@celery_app.task(bind=True)
def analyze_frame_task(self, frame_base64: str, session_id: int):
    db = SessionLocal()
    try:
        detector = get_detector()
        result = detector.analyze_posture(frame_base64)
        
        # Save to Database
        try:
            posture_log = database.PostureLog(
                session_id=session_id,
                timestamp=datetime.utcnow(),
                posture_status=result['posture_status'],
                neck_angle=result.get('neck_angle'),
                torso_angle=result.get('torso_angle'),
                distance_score=result.get('distance_score'),
                confidence=result.get('confidence')
            )
            db.add(posture_log)
            db.commit()
            
            # --- ENTERPRISE FEATURE: EVIDENCE LOCKER ---
            if result['posture_status'] == 'SLOUCHING':
                # Fetch settings for this session's user
                session = db.query(database.Session).filter(database.Session.id == session_id).first()
                if session:
                    settings = db.query(database.UserSettings).filter(database.UserSettings.user_id == session.user_id).first()
                    
                    if settings and settings.enabled_evidence_locker:
                        # Check logic: Save specific frame based on key? 
                        # For MVP, let's save every 5th random slouch frame to save space
                        # or better, check if we just triggered an alert
                        
                        # Process Image
                        save_evidence(frame_base64, session_id, result.get('landmarks'), settings.blur_screenshots)

        except Exception as db_err:
            print(f"Database/Evidence error: {db_err}")
            db.rollback()
        
        # Add timestamp
        result['timestamp'] = time.time()
        result['session_id'] = session_id
        
        # Broadcast to WebSocket via Redis Channel
        r.publish("posture_updates", json.dumps(result))
        
        # --- Alert Logic (> 8 seconds) ---
        user_key = f"session:{session_id}:slouch_start"
        alert_cooldown_key = f"session:{session_id}:alert_cooldown"
        
        if result['posture_status'] == 'SLOUCHING':
            start_time = r.get(user_key)
            if start_time:
                duration = time.time() - float(start_time)
                if duration > 8:
                    # Check cooldown
                    if not r.get(alert_cooldown_key):
                        # Trigger Notification Worker
                        celery_app.send_task(
                            "app.workers.notification_worker.send_notification_task",
                            args=["SLOUCH_ALERT", "You have been slouching for over 8 seconds!"]
                        )
                        # Set cooldown (e.g., 2 minutes)
                        r.setex(alert_cooldown_key, 120, "1")
            else:
                # Start tracking
                r.set(user_key, time.time())
        else:
            # Reset tracker if posture is good
            r.delete(user_key)
            
        return result
    except Exception as e:
        print(f"Error in analyze_frame_task: {e}")
        return {"error": str(e)}
    finally:
        db.close()

def save_evidence(base64_string, session_id, landmarks, blur_enabled):
    """
    Decodes image, blurs face if enabled, and saves to disk.
    """
    try:
        # Decode Base64
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return

        # Blur Face Logic
        if blur_enabled and landmarks:
            # MediaPipe landmarks 0-10 are approximate face area
            # We'll compute a bounding box
            h, w, c = img.shape
            
            # Get Nose (0) and Ears (7, 8) as proxies
            nose_x = int(landmarks.get('nose', {}).get('x', 0.5) * w)
            nose_y = int(landmarks.get('nose', {}).get('y', 0.5) * h)
            
            # Simple box: 15% of width/height around nose
            box_size = int(w * 0.15)
            x1 = max(0, nose_x - box_size)
            y1 = max(0, nose_y - box_size)
            x2 = min(w, nose_x + box_size)
            y2 = min(h, nose_y + box_size)
            
            # Apply Gaussian Blur to ROI
            roi = img[y1:y2, x1:x2]
            if roi.size > 0:
                blurred_roi = cv2.GaussianBlur(roi, (51, 51), 0)
                img[y1:y2, x1:x2] = blurred_roi

        # Save to disk
        timestamp = int(time.time())
        filename = f"{EVIDENCE_DIR}/session_{session_id}_{timestamp}.jpg"
        
        # Check if file already exists (unlikely with timestamp) or throttle
        # For demo, only save if not exists
        if not os.path.exists(filename):
             cv2.imwrite(filename, img)
             
    except Exception as e:
        print(f"Evidence locker failed: {e}")
