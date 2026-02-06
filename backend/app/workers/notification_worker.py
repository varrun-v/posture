from app.core.celery_app import celery_app
import redis
import json
import time
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)

@celery_app.task
def send_notification_task(type: str, message: str):
    payload = {
        "type": "NOTIFICATION",
        "title": type,
        "message": message,
        "timestamp": time.time()
    }
    # Publish to Redis so API can pick it up
    r.publish("notifications", json.dumps(payload))
    print(f"Notification sent: {message}")
