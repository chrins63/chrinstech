"""
ChrisTech - Website Checker Logic
=================================
Performs HTTP GET checks against monitored websites, measures latency,
verifies optional keywords, logs results into PostgreSQL, and detects
status transitions to fire email alerts.

Beginner Guide:
- requests.get() makes an HTTP request across the internet to the target server.
- Status codes:
    * 200-299: OK / Success
    * 300-399: Redirection (e.g., http -> https)
    * 400-499: Client error (e.g., 404 Not Found, 403 Forbidden)
    * 500-599: Server error (e.g., 500 Internal Error, 502 Bad Gateway)
- Keyword checking: Many sites can return a 200 OK while showing a database error
  or maintenance page. Keyword verification ensures critical content actually loaded.
"""

import time
import requests
from datetime import datetime
from app import app, db, Website, CheckLog, SupportTicket, TicketReply
from notifier import send_alert_email

# HTTP User-Agent header so web servers can identify the monitoring tool
DEFAULT_HEADERS = {
    'User-Agent': 'ChrisTech-Monitor/1.0 (+https://github.com/christech-monitor)'
}
TIMEOUT_SECONDS = 10


def ping_website(url, keyword=None):
    """
    Sends an HTTP GET request to test a website.

    Returns a dictionary containing:
    - is_up (bool): True if status_code < 400 and keyword matches (if set)
    - status_code (int or None): HTTP status code
    - response_time_ms (int or None): Response latency in milliseconds
    - error_message (str or None): Error description if check failed
    """
    start_time = time.time()

    try:
        # Perform HTTP GET request with a strict 10-second timeout
        response = requests.get(
            url,
            headers=DEFAULT_HEADERS,
            timeout=TIMEOUT_SECONDS,
            allow_redirects=True  # Follow normal 301/302 redirects
        )

        # Calculate round-trip response time in milliseconds
        # Either from requests response.elapsed or high-resolution clock
        response_time_ms = int(response.elapsed.total_seconds() * 1000)
        status_code = response.status_code

        # Rule 1: Website is UP if status code is under 400 (< 400)
        if status_code >= 400:
            return {
                'is_up': False,
                'status_code': status_code,
                'response_time_ms': response_time_ms,
                'error_message': f"HTTP Error {status_code}: {response.reason or 'Unhealthy status'}"
            }

        # Rule 2: If a keyword is configured, verify it appears in the HTML content
        if keyword and keyword.strip():
            target_keyword = keyword.strip()
            # Case-insensitive or direct check in response body text
            if target_keyword.lower() not in response.text.lower():
                return {
                    'is_up': False,
                    'status_code': status_code,
                    'response_time_ms': response_time_ms,
                    'error_message': f"Keyword '{target_keyword}' was not found in response HTML."
                }

        # Both HTTP code and keyword passed!
        return {
            'is_up': True,
            'status_code': status_code,
            'response_time_ms': response_time_ms,
            'error_message': None
        }

    except requests.exceptions.Timeout:
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'is_up': False,
            'status_code': None,
            'response_time_ms': elapsed,
            'error_message': f"Connection timed out after {TIMEOUT_SECONDS} seconds."
        }

    except requests.exceptions.SSLError as ssl_err:
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'is_up': False,
            'status_code': None,
            'response_time_ms': elapsed,
            'error_message': f"SSL / HTTPS Certificate error: {ssl_err}"
        }

    except requests.exceptions.ConnectionError as conn_err:
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'is_up': False,
            'status_code': None,
            'response_time_ms': elapsed,
            'error_message': f"Connection failed. Server may be unreachable or DNS lookup failed."
        }

    except requests.exceptions.RequestException as req_err:
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'is_up': False,
            'status_code': None,
            'response_time_ms': elapsed,
            'error_message': f"Request error: {req_err}"
        }

    except Exception as unexpected:
        elapsed = int((time.time() - start_time) * 1000)
        return {
            'is_up': False,
            'status_code': None,
            'response_time_ms': elapsed,
            'error_message': f"Unexpected check error: {unexpected}"
        }


def check_website_and_log(website_id, send_alert_if_changed=True):
    """
    Executes a check for a single website by ID, creates a CheckLog in the database,
    and sends an alert email ONLY IF the status changed (UP -> DOWN or DOWN -> UP).

    Returns:
    The newly created CheckLog model instance.
    """
    with app.app_context():
        website = Website.query.get(website_id)
        if not website:
            print(f"[ChrisTech Checker] Website with ID {website_id} not found.")
            return None

        # Fetch the previous status before this new check
        # We find the latest CheckLog currently in the database
        last_log = website.latest_log
        previous_status_is_up = last_log.is_up if last_log is not None else None

        # Execute HTTP ping
        result = ping_website(website.url, website.keyword)

        # Create new database record
        new_log = CheckLog(
            website_id=website.id,
            is_up=result['is_up'],
            status_code=result['status_code'],
            response_time_ms=result['response_time_ms'],
            error_message=result['error_message'],
            checked_at=datetime.utcnow()
        )

        db.session.add(new_log)
        db.session.commit()

        # Determine if a status transition occurred
        new_status_is_up = result['is_up']

        # Log to terminal console
        status_label = "UP  " if new_status_is_up else "DOWN"
        time_display = f"{result['response_time_ms']}ms" if result['response_time_ms'] is not None else "N/A"
        code_display = f"HTTP {result['status_code']}" if result['status_code'] is not None else "NO-RESP"
        print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] [{status_label}] {website.name} ({website.url}) - {code_display}, {time_display}")

        if send_alert_if_changed and previous_status_is_up is not None:
            # Check for transition: UP -> DOWN or DOWN -> UP
            if previous_status_is_up != new_status_is_up:
                print(f"⚠️  [STATUS CHANGE DETECTED] '{website.name}' transitioned: "
                      f"{'UP' if previous_status_is_up else 'DOWN'} -> {'UP' if new_status_is_up else 'DOWN'}")

                # Send email alert via notifier
                send_alert_email(
                    site_name=website.name,
                    site_url=website.url,
                    is_up=new_status_is_up,
                    status_code=result['status_code'],
                    response_time_ms=result['response_time_ms'],
                    error_message=result['error_message']
                )

                # Automated Incident Ticket Management:
                # If site went DOWN, auto-open an urgent Incident Ticket in the Support System
                if not new_status_is_up:
                    try:
                        existing_incident = SupportTicket.query.filter_by(
                            website_id=website.id,
                            is_automated_incident=True,
                            status='open'
                        ).first()

                        if not existing_incident:
                            timestamp_suffix = int(datetime.utcnow().timestamp()) % 100000
                            incident_ticket = SupportTicket(
                                ticket_number=f"INC-{timestamp_suffix:05d}",
                                website_id=website.id,
                                subject=f"[OUTAGE INCIDENT] {website.name} is DOWN",
                                description=(
                                    f"Automated monitoring detected an outage at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}.\n\n"
                                    f"Target URL: {website.url}\n"
                                    f"HTTP Status: {result['status_code'] if result['status_code'] else 'Connection Failed'}\n"
                                    f"Latency: {result['response_time_ms']}ms\n"
                                    f"Diagnostic Error: {result['error_message'] or 'Unreachable endpoint'}"
                                ),
                                requester_name="ChrisTech Monitor",
                                requester_email="alerts@christech.local",
                                category="outage",
                                priority="urgent",
                                status="open",
                                is_automated_incident=True
                            )
                            db.session.add(incident_ticket)
                            db.session.commit()
                            print(f"📋 [SUPPORT SYSTEM] Opened automated incident ticket #{incident_ticket.ticket_number} for {website.name}.")
                    except Exception as inc_err:
                        db.session.rollback()
                        print(f"⚠️ [SUPPORT SYSTEM] Could not auto-create incident ticket: {inc_err}")

                # If site recovered to UP, auto-resolve any open automated incident tickets
                else:
                    try:
                        open_incidents = SupportTicket.query.filter_by(
                            website_id=website.id,
                            is_automated_incident=True,
                            status='open'
                        ).all()

                        for inc in open_incidents:
                            inc.status = 'resolved'
                            inc.updated_at = datetime.utcnow()
                            recovery_reply = TicketReply(
                                ticket_id=inc.id,
                                author_name="ChrisTech Monitor",
                                author_email="alerts@christech.local",
                                is_staff=True,
                                is_internal_note=False,
                                message=(
                                    f"Service recovery confirmed at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}. "
                                    f"Endpoint returned HTTP {result['status_code']} with latency of {result['response_time_ms']}ms. "
                                    f"Incident automatically marked as RESOLVED."
                                ),
                                created_at=datetime.utcnow()
                            )
                            db.session.add(recovery_reply)
                        if open_incidents:
                            db.session.commit()
                            print(f"✅ [SUPPORT SYSTEM] Auto-resolved {len(open_incidents)} outage incident ticket(s) for {website.name}.")
                    except Exception as res_err:
                        db.session.rollback()
                        print(f"⚠️ [SUPPORT SYSTEM] Could not auto-resolve incident tickets: {res_err}")

        return new_log


def check_all_active_websites():
    """
    Finds all active websites in the database and runs checks for each.
    Called periodically by the background scheduler.
    """
    with app.app_context():
        active_sites = Website.query.filter_by(is_active=True).all()
        if not active_sites:
            print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] No active websites to check.")
            return

        print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] 🔍 Running scheduled checks for {len(active_sites)} website(s)...")
        for site in active_sites:
            try:
                check_website_and_log(site.id, send_alert_if_changed=True)
            except Exception as e:
                print(f"❌ Error checking website '{site.name}': {e}")


if __name__ == '__main__':
    # Test ping logic directly from command line
    print("Testing ping_website on https://httpbin.org/status/200 ...")
    test_result = ping_website("https://httpbin.org/status/200")
    print(f"Result: {test_result}")
