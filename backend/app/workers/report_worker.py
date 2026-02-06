from app.core.celery_app import celery_app

@celery_app.task
def generate_daily_report_task(user_id: int):
    # Placeholder for daily report
    pass
