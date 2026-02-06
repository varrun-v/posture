from app.core.celery_app import celery_app
from app.core.posture_detector import get_detector
import redis
import json
import time
import os

# Connect to Redis (Sync for Celery)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

@celery_app.task(bind=True)
def analyze_frame_task(self, frame_base64: str, session_id: int):
    try:
        detector = get_detector()
        result = detector.analyze_posture(frame_base64)
        
        # Add timestamp
        result['timestamp'] = time.time()
        result['session_id'] = session_id
        
        # Broadcast to WebSocket via Redis Channel
        r.publish("posture_updates", json.dumps(result))
        
        # --- Alert Logic (> 20 seconds) ---
        user_key = f"session:{session_id}:slouch_start"
        alert_cooldown_key = f"session:{session_id}:alert_cooldown"
        
        if result['posture_status'] == 'SLOUCHING':
            start_time = r.get(user_key)
            if start_time:
                duration = time.time() - float(start_time)
                if duration > 20:
                    # Check cooldown
                    if not r.get(alert_cooldown_key):
                        # Trigger Notification Worker
                        celery_app.send_task(
                            "app.workers.notification_worker.send_notification_task",
                            args=["SLOUCH_ALERT", "You have been slouching for over 20 seconds!"]
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
