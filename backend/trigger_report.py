from app.workers.report_worker import generate_daily_report_task

if __name__ == "__main__":
    print("🚀 Manually triggering Daily Report Task...")
    # Send task to Celery
    result = generate_daily_report_task.delay(user_id=1)
    print(f"✅ Task queued! Task ID: {result.id}")
    print("Check 'celery-worker' logs to see progress.")
