"""
ChrisTech - Email Notifier (SMTP)
=================================
Handles formatting and dispatching email notifications when a monitored
website changes its status (UP -> DOWN or DOWN -> UP).

Beginner Guide:
- SMTP (Simple Mail Transfer Protocol) is the standard internet protocol for sending emails.
- TLS (Transport Layer Security) encrypts the connection between this app and your email provider (port 587).
- Gmail users: You need a 16-character "App Password" generated in Google Account settings
  (Security -> 2-Step Verification -> App Passwords).
- If SMTP credentials are left empty in .env, this module gracefully prints the alert to the terminal
  so you can test the monitoring system without setting up an email account immediately.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()


def get_smtp_config():
    """
    Retrieves SMTP settings from environment variables.
    """
    return {
        'server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.getenv('SMTP_PORT', 587)),
        'user': os.getenv('SMTP_EMAIL', ''),
        'password': os.getenv('SMTP_PASSWORD', ''),
        'recipient': os.getenv('ALERT_RECIPIENT_EMAIL', '')
    }


def send_alert_email(site_name, site_url, is_up, status_code=None, response_time_ms=None, error_message=None):
    """
    Sends an SMTP alert email to notify the user of a status change.

    Parameters:
    - site_name (str): The friendly name of the website (e.g., 'My Blog')
    - site_url (str): The URL being monitored (e.g., 'https://myblog.com')
    - is_up (bool): True if recovered/UP, False if failed/DOWN
    - status_code (int or None): HTTP status code returned by server (e.g. 200, 500, 404)
    - response_time_ms (int or None): Response time in milliseconds
    - error_message (str or None): Specific error or exception message
    """
    config = get_smtp_config()
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')

    # Determine alert type, subject, and color scheme
    if is_up:
        status_text = "RECOVERED / UP"
        subject = f"[RESOLVED] ChrisTech Monitor: '{site_name}' is UP"
        accent_color = "#10b981"  # Emerald Green
        status_badge = "🟢 ONLINE"
    else:
        status_text = "OUTAGE / DOWN"
        subject = f"[ALERT] ChrisTech Monitor: '{site_name}' is DOWN"
        accent_color = "#ef4444"  # Coral Red
        status_badge = "🔴 OFFLINE"

    # Build plain text body (for basic mail clients)
    plain_body = f"""
==================================================
ChrisTech Website Monitoring Alert
==================================================

Status: {status_text}
Website Name: {site_name}
URL: {site_url}
Timestamp: {now_str}
Status Code: {status_code if status_code is not None else 'N/A'}
Response Time: {f'{response_time_ms} ms' if response_time_ms is not None else 'N/A'}
Error Details: {error_message or 'None'}

--------------------------------------------------
This alert was triggered automatically by ChrisTech because
the site status changed.
"""

    # Build clean, modern HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 24px;
        }}
        .container {{
          max-width: 580px;
          margin: 0 auto;
          background-color: #1e293b;
          border-radius: 12px;
          border: 1px solid #334155;
          overflow: hidden;
        }}
        .header {{
          background-color: #090d16;
          padding: 20px 24px;
          border-bottom: 2px solid {accent_color};
          display: flex;
          align-items: center;
          justify-content: space-between;
        }}
        .header h2 {{
          margin: 0;
          font-size: 18px;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }}
        .badge {{
          background-color: {accent_color}22;
          color: {accent_color};
          font-weight: 700;
          font-size: 13px;
          padding: 4px 12px;
          border-radius: 9999px;
          border: 1px solid {accent_color}66;
        }}
        .content {{
          padding: 24px;
        }}
        .headline {{
          font-size: 20px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 16px;
          color: #ffffff;
        }}
        .data-table {{
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }}
        .data-table td {{
          padding: 10px 12px;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }}
        .label {{
          color: #94a3b8;
          font-weight: 500;
          width: 35%;
        }}
        .value {{
          color: #f1f5f9;
          font-weight: 600;
        }}
        .error-box {{
          background-color: #450a0a;
          border: 1px solid #b91c1c;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: monospace;
          font-size: 13px;
          color: #fca5a5;
          margin-top: 12px;
          word-break: break-all;
        }}
        .footer {{
          padding: 16px 24px;
          background-color: #0f172a;
          font-size: 12px;
          color: #64748b;
          text-align: center;
          border-top: 1px solid #334155;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚡ ChrisTech Monitor</h2>
          <span class="badge">{status_badge}</span>
        </div>
        <div class="content">
          <p class="headline">Website {site_name} is {status_text}</p>
          <table class="data-table">
            <tr>
              <td class="label">Website</td>
              <td class="value"><a href="{site_url}" style="color: #38bdf8; text-decoration: none;">{site_url}</a></td>
            </tr>
            <tr>
              <td class="label">Status Code</td>
              <td class="value">{status_code if status_code is not None else 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Response Time</td>
              <td class="value">{f'{response_time_ms} ms' if response_time_ms is not None else 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Detected At</td>
              <td class="value">{now_str}</td>
            </tr>
          </table>

          {f'<div class="error-box"><strong>Error Details:</strong><br>{error_message}</div>' if error_message else ''}
        </div>
        <div class="footer">
          ChrisTech Self-Hosted Monitoring &bull; Alerts only trigger when status changes.
        </div>
      </div>
    </body>
    </html>
    """

    # Check if SMTP credentials have been configured
    if not config['user'] or not config['password'] or not config['recipient']:
        print("\n" + "="*70)
        print(f"🔔 [NOTIFIER SIMULATION] Email alert triggered for '{site_name}' ({status_text})")
        print(f"   Subject: {subject}")
        print(f"   Details: Code={status_code}, Time={response_time_ms}ms, Error={error_message}")
        print("   Note: Set SMTP_EMAIL, SMTP_PASSWORD, and ALERT_RECIPIENT_EMAIL in .env to receive real emails.")
        print("="*70 + "\n")
        return False

    # Dispatch real email via SMTP
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"ChrisTech Monitor <{config['user']}>"
        msg['To'] = config['recipient']

        # Attach plain and HTML versions
        msg.attach(MIMEText(plain_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        # Connect to SMTP server using TLS
        with smtplib.SMTP(config['server'], config['port'], timeout=15) as server:
            server.ehlo()
            server.starttls()  # Upgrade connection to secure TLS
            server.ehlo()
            server.login(config['user'], config['password'])
            server.sendmail(config['user'], [config['recipient']], msg.as_string())

        print(f"✅ [NOTIFIER] Alert email successfully delivered to {config['recipient']} for '{site_name}'.")
        return True

    except Exception as exc:
        print(f"❌ [NOTIFIER ERROR] Failed to send email via SMTP: {exc}")
        return False


if __name__ == '__main__':
    # Test script standalone
    print("Testing notifier.py directly...")
    send_alert_email(
        site_name="Example Site",
        site_url="https://example.com",
        is_up=False,
        status_code=503,
        response_time_ms=1200,
        error_message="HTTP 503: Service Unavailable"
    )
