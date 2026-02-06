from celery import Celery
import os
from kombu import Exchange, Queue

# Get Redis URL from env or default to localhost
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "posture_monitor",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.posture_worker", "app.workers.analysis_worker", "app.workers.notification_worker"]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_queues=(
        Queue("posture_queue", Exchange("posture"), routing_key="posture"),
        Queue("analysis_queue", Exchange("analysis"), routing_key="analysis"),
        Queue("notification_queue", Exchange("notification"), routing_key="notification"),
        Queue("scheduled_queue", Exchange("scheduled"), routing_key="scheduled"),
    ),
    task_routes={
        "app.workers.posture_worker.analyze_frame_task": {"queue": "posture_queue"},
        "app.workers.analysis_worker.analyze_patterns_task": {"queue": "analysis_queue"},
        "app.workers.notification_worker.send_notification_task": {"queue": "notification_queue"},
        "app.workers.report_worker.generate_daily_report_task": {"queue": "scheduled_queue"},
    },
)

if __name__ == "__main__":
    celery_app.start()
