from app.core.celery_app import celery_app

@celery_app.task
def analyze_patterns_task(session_id: int):
    # Placeholder for periodic analysis
    pass
