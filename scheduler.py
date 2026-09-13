"""
ChrisTech - Background Checker Scheduler
========================================
Runs as a dedicated, standalone background process separate from the
web server. Uses APScheduler (Advanced Python Scheduler) to periodically
trigger checks on all active websites according to their configured intervals.

Beginner Guide:
- In production, web servers (like Flask or Gunicorn) should focus on serving HTTP
  requests quickly, not running long-running sleep loops or blocking tasks.
- A separate scheduler process runs continuously in the background, waking up
  on a timer to trigger jobs.
- APScheduler's BlockingScheduler blocks the current thread, making it the ideal
  choice for a standalone command-line worker script:
      python scheduler.py
"""

import os
import sys
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Load environment variables
load_dotenv()

# Import Flask app and models from app.py
from app import app, db, Website
from checker import check_website_and_log


def check_due_websites():
    """
    Evaluates all active websites and performs checks on those that are due.

    How it works:
    1. Fetches all websites marked as is_active=True.
    2. Compares the current UTC time with the site's latest check timestamp.
    3. If elapsed time >= site.check_interval_minutes (or if never checked before),
       the checker runs and logs the result.
    4. Only sends email alerts when status changes (UP -> DOWN or DOWN -> UP).
    """
    with app.app_context():
        try:
            active_sites = Website.query.filter_by(is_active=True).all()
            if not active_sites:
                print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}] [Scheduler] No active websites configured.")
                return

            now = datetime.utcnow()
            checked_count = 0

            for site in active_sites:
                latest = site.latest_log

                # Determine if site is due for a check
                if latest is None:
                    # Never checked before: check immediately!
                    is_due = True
                else:
                    elapsed = now - latest.checked_at
                    interval_delta = timedelta(minutes=site.check_interval_minutes)
                    is_due = elapsed >= interval_delta

                if is_due:
                    checked_count += 1
                    try:
                        check_website_and_log(site.id, send_alert_if_changed=True)
                    except Exception as e:
                        print(f"❌ [Scheduler Error] Failed checking '{site.name}': {e}")

            if checked_count > 0:
                print(f"[{now.strftime('%Y-%m-%d %H:%M:%S UTC')}] [Scheduler] Completed cycle. Evaluated {checked_count} due site(s).\n")

        except Exception as db_err:
            print(f"❌ [Scheduler Database Error]: {db_err}")


def main():
    """
    Initializes and starts the APScheduler background daemon.
    """
    print("=" * 65)
    print("⚡ ChrisTech Background Checker Scheduler")
    print("=" * 65)
    print("Monitoring engine starting up...")
    print("Checking frequency: Evaluates websites every 30 seconds.")
    print("Alerting rule: Alerts dispatch ONLY upon status change (anti-spam).")
    print("Press Ctrl+C to stop the scheduler.")
    print("=" * 65)

    # Run an initial check on startup so the user doesn't have to wait for the first interval tick
    print("\n🚀 [Scheduler] Running initial check cycle on startup...")
    check_due_websites()

    # Initialize APScheduler
    scheduler = BlockingScheduler()

    # Schedule the master evaluation job to run every 30 seconds
    # Websites are checked as soon as their configured interval has elapsed
    scheduler.add_job(
        func=check_due_websites,
        trigger=IntervalTrigger(seconds=30),
        id='christech_master_check_job',
        name='Check Due Websites',
        replace_existing=True
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n🛑 [ChrisTech] Background scheduler stopped gracefully.")


if __name__ == '__main__':
    main()
