from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models import database
from app.core.config import settings
from sqlalchemy import func
from datetime import datetime, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import matplotlib.pyplot as plt
import io
import os

@celery_app.task
def generate_daily_report_task(user_id: int):
    """
    Generates a daily report chart and emails it to the user.
    Simulates a long-running data processing job.
    """
    print(f"📊 Generating Daily Report for User {user_id}...")
    
    # Check if Email Config is set
    if not settings.smtp_user or not settings.smtp_password:
        print("⚠️ SMTP credentials not set. Skipping email report.")
        return "Skipped (No SMTP Config)"

    recipient = settings.emails_to_email
    if not recipient:
        print("⚠️ No recipient email set. Skipping.")
        return "Skipped (No Recipient)"

    db = SessionLocal()
    try:
        # 1. Fetch Data (Last 24 Hours)
        since = datetime.utcnow() - timedelta(days=1)
        
        sessions = db.query(database.Session).filter(
            database.Session.user_id == user_id,
            database.Session.started_at >= since
        ).all()
        
        if not sessions:
            print("No sessions found for today.")
            return "No Data"

        # 2. Aggregation (Deep Analytics)
        total_duration = 0
        total_slouch = 0
        total_good = 0
        current_streak = 0
        max_slouch_streak = 0
        
        for session in sessions:
            logs = db.query(database.PostureLog).filter(
                database.PostureLog.session_id == session.id
            ).all()
            
            # Sort by timestamp for accurate streaks
            logs.sort(key=lambda x: x.timestamp)

            prev_log_time = None

            for log in logs:
                # Time delta logic for accurate duration
                duration = 0.5 # Default fallback
                if prev_log_time:
                    delta = (log.timestamp - prev_log_time).total_seconds()
                    if delta < 10: # Only count if reasonably continuous
                        duration = delta
                
                if log.posture_status == 'SLOUCHING':
                    total_slouch += duration
                    current_streak += duration
                    if current_streak > max_slouch_streak:
                        max_slouch_streak = current_streak
                elif log.posture_status == 'GOOD':
                    total_good += duration
                    current_streak = 0 # Reset streak
                else:
                    current_streak = 0
                
                prev_log_time = log.timestamp
        
        total_duration = total_slouch + total_good
        if total_duration == 0:
            return "Insufficient Data"

        # Calculate Efficiency Score
        posture_score = int((total_good / total_duration) * 100)
        score_color = "#16a34a" if posture_score > 70 else ("#ca8a04" if posture_score > 50 else "#dc2626")

        # 3. Generate Composite Chart (Pie + Bar)
        plt.switch_backend('Agg') 
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
        
        # Pie Chart (Distribution)
        labels = ['Good', 'Slouching']
        sizes = [total_good, total_slouch]
        colors = ['#4ade80', '#f87171']
        ax1.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax1.set_title('Posture Distribution')

        # Bar Chart (Comparison)
        categories = ['Good', 'Slouching']
        values = [total_good / 60, total_slouch / 60]
        bars = ax2.bar(categories, values, color=colors)
        ax2.set_ylabel('Duration (Minutes)')
        ax2.set_title(f'Total Activity: {total_duration/60:.1f} min')
        
        # Add values on top
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f} m',
                    ha='center', va='bottom')
        
        plt.tight_layout()
        
        # Save to buffer
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        plt.close(fig)
        
        print("📈 Complex Chart generated successfully.")

        # 4. Compose Email
        msg = MIMEMultipart('related')
        msg['Subject'] = f"Daily Posture Report - {datetime.now().strftime('%Y-%m-%d')}"
        msg['From'] = settings.emails_from_email
        msg['To'] = recipient

        # HTML Body
        html_content = f"""
        <html>
        <body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, Helvetica, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding:24px;">
                
                <!-- Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
                    
                    <!-- Header -->
                    <tr>
                    <td style="background:#4f46e5; padding:20px; color:#ffffff;">
                        <h2 style="margin:0; font-size:22px;">Daily Posture Report</h2>
                        <p style="margin:4px 0 0; font-size:14px; opacity:0.9;">
                        {datetime.now().strftime("%A, %B %d, %Y")}
                        </p>
                    </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                    <td style="padding:24px; color:#111827;">
                        <p style="font-size:15px; margin-top:0;">
                        Here’s your deep-dive analytics for the last 24 hours:
                        </p>

                        <!-- Hero Stats -->
                        <div style="text-align:center; padding: 20px 0; border-bottom: 1px solid #eee; margin-bottom: 20px;">
                             <p style="font-size: 14px; color: #666; margin:0;">Posture Efficiency Score</p>
                             <h1 style="font-size: 48px; color: {score_color}; margin: 5px 0;">{posture_score}%</h1>
                        </div>

                        <!-- Grid -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                        <tr>
                            <td width="33%" align="center" style="padding:12px; background:#f9fafb; border-radius:6px;">
                            <p style="margin:0; font-size:12px; color:#6b7280;">Total Activity</p>
                            <p style="margin:6px 0 0; font-size:18px; font-weight:bold;">
                                {total_duration/60:.1f} min
                            </p>
                            </td>
                            <td width="33%" align="center" style="padding:12px;">
                            <p style="margin:0; font-size:12px; color:#6b7280;">Max Streak (Bad)</p>
                            <p style="margin:6px 0 0; font-size:18px; font-weight:bold; color:#f87171;">
                                {max_slouch_streak:.0f} sec
                            </p>
                            </td>
                            <td width="33%" align="center" style="padding:12px;">
                            <p style="margin:0; font-size:12px; color:#6b7280;">Good Time</p>
                            <p style="margin:6px 0 0; font-size:18px; font-weight:bold; color:#16a34a;">
                                {total_good/60:.1f} min
                            </p>
                            </td>
                        </tr>
                        </table>

                        <!-- Chart -->
                        <p style="font-size:14px; margin-bottom:8px; color:#374151;">
                        Visual Analysis:
                        </p>
                        <img src="cid:chart_image" alt="Daily Posture Chart"
                            style="width:100%; max-width:100%; border-radius:6px; border:1px solid #e5e7eb;">

                        <p style="margin-top:20px; font-size:14px; color:#555;">
                        <i>"Consistency is the key to mastery."</i>
                        </p>
                    </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                    <td style="padding:16px; background:#f9fafb; text-align:center; font-size:12px; color:#6b7280;">
                        Generated automatically by <b>Posture Monitor</b><br>
                        You’re receiving this because posture tracking is enabled.
                    </td>
                    </tr>

                </table>

                </td>
            </tr>
            </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_content, 'html'))

        # Attach Image
        img = MIMEImage(img_buf.read())
        img.add_header('Content-ID', '<chart_image>')
        msg.attach(img)

        # 5. Send Email via Gmail SMTP
        print(f"📧 Sending email to {recipient}...")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
            
        print("✅ Report sent successfully!")
        return "Sent"

    except Exception as e:
        print(f"✗ Report generation failed: {e}")
        return f"Failed: {e}"
    finally:
        db.close()
