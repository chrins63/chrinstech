import { CodeDeliverable } from '../types';

export const CODE_DELIVERABLES: CodeDeliverable[] = [
  {
    filename: 'app.py',
    language: 'python',
    category: 'Backend',
    description: 'Main Flask application, PostgreSQL SQLAlchemy models (Website, CheckLog), and dashboard routes.',
    content: `"""
ChrisTech - Self-Hosted Website Monitoring Tool
==============================================
Main Flask application containing database models, configuration,
and web dashboard routes.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'christech-dev-secret-key')

# PostgreSQL Database Configuration
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'christech_db')

if os.getenv('USE_SQLITE', 'false').lower() in ('true', '1'):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///christech.db'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Website(db.Model):
    __tablename__ = 'website'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    check_interval_minutes = db.Column(db.Integer, default=5, nullable=False)
    keyword = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    check_logs = db.relationship('CheckLog', backref='website', lazy='dynamic',
                                 cascade='all, delete-orphan', order_by='desc(CheckLog.checked_at)')

    @property
    def latest_log(self):
        return self.check_logs.first()

    @property
    def status(self):
        if not self.is_active:
            return 'PAUSED'
        last = self.latest_log
        if not last:
            return 'PENDING'
        return 'UP' if last.is_up else 'DOWN'

    @property
    def uptime_percentage(self):
        logs = self.check_logs.limit(100).all()
        if not logs:
            return 100.0
        up_count = sum(1 for log in logs if log.is_up)
        return round((up_count / len(logs)) * 100.0, 1)

class CheckLog(db.Model):
    __tablename__ = 'check_log'
    id = db.Column(db.Integer, primary_key=True)
    website_id = db.Column(db.Integer, db.ForeignKey('website.id'), nullable=False, index=True)
    is_up = db.Column(db.Boolean, nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    response_time_ms = db.Column(db.Integer, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

@app.route('/')
def dashboard():
    websites = Website.query.order_by(Website.created_at.desc()).all()
    total_sites = len(websites)
    up_sites = sum(1 for w in websites if w.status == 'UP')
    down_sites = sum(1 for w in websites if w.status == 'DOWN')
    paused_sites = sum(1 for w in websites if w.status == 'PAUSED')
    response_times = [w.latest_log.response_time_ms for w in websites if w.latest_log and w.latest_log.response_time_ms and w.status == 'UP']
    avg_response_time = round(sum(response_times) / len(response_times)) if response_times else 0

    return render_template('dashboard.html', websites=websites, total_sites=total_sites,
                           up_sites=up_sites, down_sites=down_sites, paused_sites=paused_sites,
                           avg_response_time=avg_response_time)

@app.route('/add', methods=['GET', 'POST'])
def add_website():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        url = request.form.get('url', '').strip()
        interval = int(request.form.get('check_interval_minutes', 5))
        keyword = request.form.get('keyword', '').strip() or None
        new_site = Website(name=name, url=url, check_interval_minutes=interval, keyword=keyword)
        db.session.add(new_site)
        db.session.commit()
        from checker import check_website_and_log
        check_website_and_log(new_site.id, send_alert_if_changed=False)
        flash(f"Website '{name}' added successfully!", 'success')
        return redirect(url_for('dashboard'))
    return render_template('add_website.html')

@app.route('/website/<int:website_id>')
def site_detail(website_id):
    website = Website.query.get_or_404(website_id)
    recent_checks = website.check_logs.limit(50).all()
    return render_template('site_detail.html', website=website, recent_checks=recent_checks)

@app.route('/website/<int:website_id>/delete', methods=['POST'])
def delete_website(website_id):
    website = Website.query.get_or_404(website_id)
    db.session.delete(website)
    db.session.commit()
    flash(f"Website '{website.name}' deleted.", 'info')
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)`
  },
  {
    filename: 'checker.py',
    language: 'python',
    category: 'Logic',
    description: 'HTTP GET checker with 10s timeout, <400 status check, keyword verification, and alert triggers.',
    content: `"""
ChrisTech - Website Checker Logic
=================================
Performs HTTP GET checks, measures response latency,
verifies keywords, logs to PostgreSQL, and detects status changes.
"""

import time
import requests
from datetime import datetime
from app import app, db, Website, CheckLog
from notifier import send_alert_email

TIMEOUT_SECONDS = 10
HEADERS = {'User-Agent': 'ChrisTech-Monitor/1.0 (+https://github.com/christech-monitor)'}

def ping_website(url, keyword=None):
    start_time = time.time()
    try:
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT_SECONDS, allow_redirects=True)
        response_time_ms = int(response.elapsed.total_seconds() * 1000)
        status_code = response.status_code

        # Rule 1: HTTP Status Code < 400
        if status_code >= 400:
            return {'is_up': False, 'status_code': status_code, 'response_time_ms': response_time_ms,
                    'error_message': f"HTTP Error {status_code}: {response.reason or 'Unhealthy'}"}

        # Rule 2: Keyword verification in HTML body
        if keyword and keyword.strip():
            if keyword.strip().lower() not in response.text.lower():
                return {'is_up': False, 'status_code': status_code, 'response_time_ms': response_time_ms,
                        'error_message': f"Keyword '{keyword}' not found in HTML response."}

        return {'is_up': True, 'status_code': status_code, 'response_time_ms': response_time_ms, 'error_message': None}

    except requests.exceptions.Timeout:
        elapsed = int((time.time() - start_time) * 1000)
        return {'is_up': False, 'status_code': None, 'response_time_ms': elapsed,
                'error_message': f"Connection timed out after {TIMEOUT_SECONDS}s."}
    except requests.exceptions.ConnectionError:
        elapsed = int((time.time() - start_time) * 1000)
        return {'is_up': False, 'status_code': None, 'response_time_ms': elapsed,
                'error_message': "Connection failed. Server unreachable or DNS failed."}
    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        return {'is_up': False, 'status_code': None, 'response_time_ms': elapsed, 'error_message': str(e)}

def check_website_and_log(website_id, send_alert_if_changed=True):
    with app.app_context():
        website = Website.query.get(website_id)
        if not website: return None
        last_log = website.latest_log
        previous_status = last_log.is_up if last_log else None

        result = ping_website(website.url, website.keyword)
        new_log = CheckLog(website_id=website.id, is_up=result['is_up'], status_code=result['status_code'],
                           response_time_ms=result['response_time_ms'], error_message=result['error_message'])
        db.session.add(new_log)
        db.session.commit()

        # Send alert ONLY when status transitions
        if send_alert_if_changed and previous_status is not None and previous_status != result['is_up']:
            send_alert_email(site_name=website.name, site_url=website.url, is_up=result['is_up'],
                             status_code=result['status_code'], response_time_ms=result['response_time_ms'],
                             error_message=result['error_message'])
        return new_log`
  },
  {
    filename: 'notifier.py',
    language: 'python',
    category: 'Logic',
    description: 'Email alerts via SMTP (TLS) on status transitions with HTML and plaintext templates.',
    content: `"""
ChrisTech - Email Notifier (SMTP)
=================================
Dispatches emails when a website goes DOWN or RECOVERS (UP).
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def send_alert_email(site_name, site_url, is_up, status_code=None, response_time_ms=None, error_message=None):
    server_host = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    port = int(os.getenv('SMTP_PORT', 587))
    sender = os.getenv('SMTP_EMAIL', '')
    password = os.getenv('SMTP_PASSWORD', '')
    recipient = os.getenv('ALERT_RECIPIENT_EMAIL', '')

    subject = f"[RESOLVED] '{site_name}' is UP" if is_up else f"[ALERT] '{site_name}' is DOWN"
    
    if not sender or not password or not recipient:
        print(f"🔔 [NOTIFIER SIMULATION] {subject} -> {recipient or 'No email configured'}")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"ChrisTech Monitor <{sender}>"
    msg['To'] = recipient

    plain_text = f"Website: {site_name}\\nURL: {site_url}\\nStatus: {'UP' if is_up else 'DOWN'}\\nCode: {status_code}\\nLatency: {response_time_ms}ms\\nError: {error_message}"
    msg.attach(MIMEText(plain_text, 'plain'))

    with smtplib.SMTP(server_host, port, timeout=15) as server:
        server.starttls()
        server.login(sender, password)
        server.sendmail(sender, [recipient], msg.as_string())
    print(f"✅ Alert email delivered to {recipient}")
    return True`
  },
  {
    filename: 'scheduler.py',
    language: 'python',
    category: 'Backend',
    description: 'Standalone background process using APScheduler to run checks based on intervals.',
    content: `"""
ChrisTech - Background Checker Scheduler
========================================
Runs as a separate worker process from Flask.
"""

from datetime import datetime, timedelta
from dotenv import load_dotenv
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app import app, Website
from checker import check_website_and_log

load_dotenv()

def check_due_websites():
    with app.app_context():
        active_sites = Website.query.filter_by(is_active=True).all()
        now = datetime.utcnow()
        for site in active_sites:
            latest = site.latest_log
            if latest is None or (now - latest.checked_at) >= timedelta(minutes=site.check_interval_minutes):
                check_website_and_log(site.id, send_alert_if_changed=True)

def main():
    print("⚡ ChrisTech Scheduler Starting (APScheduler)...")
    check_due_websites()
    scheduler = BlockingScheduler()
    scheduler.add_job(check_due_websites, trigger=IntervalTrigger(seconds=30), id='christech_checker')
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("🛑 Scheduler stopped.")

if __name__ == '__main__':
    main()`
  },
  {
    filename: 'templates/dashboard.html',
    language: 'html',
    category: 'Templates',
    description: 'Flask Jinja2 template for the dark-themed main monitoring dashboard.',
    content: `{% extends "base.html" %}
{% block content %}
<div class="stats-grid">
  <div class="stat-card">Total: {{ total_sites }}</div>
  <div class="stat-card">UP: {{ up_sites }}</div>
  <div class="stat-card">DOWN: {{ down_sites }}</div>
  <div class="stat-card">Avg Latency: {{ avg_response_time }}ms</div>
</div>

<table>
  <thead>
    <tr>
      <th>Status</th>
      <th>Website</th>
      <th>Keyword</th>
      <th>Interval</th>
      <th>Latency</th>
      <th>Uptime</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {% for site in websites %}
    <tr>
      <td><span class="badge badge-{{ site.status|lower }}">{{ site.status }}</span></td>
      <td><strong>{{ site.name }}</strong><br><small>{{ site.url }}</small></td>
      <td>{{ site.keyword or '—' }}</td>
      <td>Every {{ site.check_interval_minutes }}m</td>
      <td>{{ site.latest_log.response_time_ms }} ms</td>
      <td>{{ site.uptime_percentage }}%</td>
      <td>
        <a href="{{ url_for('site_detail', website_id=site.id) }}">Logs</a>
        <form action="{{ url_for('delete_website', website_id=site.id) }}" method="POST" onsubmit="return confirm('Delete?');">
          <button type="submit">Delete</button>
        </form>
      </td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% endblock %}`
  },
  {
    filename: 'requirements.txt',
    language: 'text',
    category: 'Config',
    description: 'Python package dependencies (Flask, SQLAlchemy, psycopg2, requests, APScheduler).',
    content: `Flask>=3.0.0
Flask-SQLAlchemy>=3.1.1
psycopg2-binary>=2.9.9
requests>=2.31.0
APScheduler>=3.10.4
python-dotenv>=1.0.1`
  },
  {
    filename: 'templates/support.html',
    language: 'html',
    category: 'Templates',
    description: 'Unified Helpdesk & Support Dashboard for all monitored websites with filters, ticket cards, and status tags.',
    content: `{% extends "base.html" %}
{% block title %}Unified Support Desk - ChrisTech{% endblock %}
{% block content %}
<div class="header-actions">
  <div>
    <h2>Centralized Support Desk</h2>
    <p>Triage tickets and customer inquiries across all your monitored websites.</p>
  </div>
  <a href="{{ url_for('new_ticket') }}" class="btn btn-primary">+ New Support Ticket</a>
</div>

<div class="stats-grid">
  <div class="stat-card">Total: {{ total_tickets }}</div>
  <div class="stat-card">Open: {{ open_tickets }}</div>
  <div class="stat-card">Urgent / Outages: {{ urgent_tickets }}</div>
</div>

<table>
  <thead>
    <tr>
      <th>Ticket #</th>
      <th>Website</th>
      <th>Subject</th>
      <th>Priority</th>
      <th>Status</th>
      <th>Requester</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {% for ticket in tickets %}
    <tr>
      <td><a href="{{ url_for('ticket_detail', ticket_id=ticket.id) }}">#{{ ticket.ticket_number }}</a></td>
      <td>{{ ticket.website.name }}</td>
      <td>{{ ticket.subject }}</td>
      <td>{{ ticket.priority }}</td>
      <td>{{ ticket.status }}</td>
      <td>{{ ticket.requester_name }}</td>
      <td><a href="{{ url_for('ticket_detail', ticket_id=ticket.id) }}">View</a></td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% endblock %}`
  },
  {
    filename: 'templates/ticket_detail.html',
    language: 'html',
    category: 'Templates',
    description: 'Ticket detail view with conversation history, public replies, and private internal staff notes.',
    content: `{% extends "base.html" %}
{% block title %}Ticket #{{ ticket.ticket_number }} - ChrisTech{% endblock %}
{% block content %}
<h2>#{{ ticket.ticket_number }}: {{ ticket.subject }}</h2>
<p>Website: {{ ticket.website.name }} | Status: {{ ticket.status }} | Priority: {{ ticket.priority }}</p>

<div class="thread">
  <div class="original-issue">{{ ticket.description }}</div>
  {% for reply in replies %}
    <div class="reply-card {% if reply.is_internal_note %}internal-note{% endif %}">
      <strong>{{ reply.author_name }}</strong> ({{ reply.created_at }})
      <p>{{ reply.message }}</p>
    </div>
  {% endfor %}
</div>

<form action="{{ url_for('add_ticket_reply', ticket_id=ticket.id) }}" method="POST">
  <textarea name="message" placeholder="Write a response..."></textarea>
  <label><input type="checkbox" name="is_internal_note"> Internal staff note only</label>
  <button type="submit">Post Reply</button>
</form>
{% endblock %}`
  },
  {
    filename: 'templates/public_portal.html',
    language: 'html',
    category: 'Templates',
    description: 'Client-facing support portal hosted per website for visitor assistance requests.',
    content: `{% extends "base.html" %}
{% block content %}
<div class="portal-box">
  <h2>{{ website.name }} - Support & Assistance</h2>
  <form action="{{ url_for('public_support_portal', website_id=website.id) }}" method="POST">
    <input type="text" name="requester_name" placeholder="Your Name" required>
    <input type="email" name="requester_email" placeholder="Your Email" required>
    <input type="text" name="subject" placeholder="Subject" required>
    <textarea name="description" placeholder="How can we help?" required></textarea>
    <button type="submit">Submit Ticket</button>
  </form>
</div>
{% endblock %}`
  },
  {
    filename: '.env.example',
    language: 'bash',
    category: 'Config',
    description: 'Environment variable definitions for PostgreSQL, Flask secret key, and SMTP credentials.',
    content: `DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=christech_db

SECRET_KEY=christech-secret-key-change-in-production

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
ALERT_RECIPIENT_EMAIL=your_email@gmail.com`
  },
  {
    filename: 'schema.sql',
    language: 'sql',
    category: 'Backend',
    description: 'PostgreSQL database DDL script with tables, constraints, foreign keys, and indexes.',
    content: `-- PostgreSQL Schema for ChrisTech
CREATE TABLE website (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    url VARCHAR(500) NOT NULL,
    check_interval_minutes INTEGER NOT NULL DEFAULT 5,
    keyword VARCHAR(200) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    ssl_issuer VARCHAR(200) NULL,
    ssl_expiry_days INTEGER NULL,
    ssl_expiry_date VARCHAR(50) NULL,
    domain_expiry_days INTEGER NULL,
    domain_expiry_date VARCHAR(50) NULL,
    domain_registrar VARCHAR(200) NULL
);

CREATE TABLE check_log (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES website(id) ON DELETE CASCADE,
    is_up BOOLEAN NOT NULL,
    status_code INTEGER NULL,
    response_time_ms INTEGER NULL,
    error_message TEXT NULL,
    checked_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE support_ticket (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    website_id INTEGER NOT NULL REFERENCES website(id) ON DELETE CASCADE,
    subject VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    requester_name VARCHAR(120) NOT NULL,
    requester_email VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    is_automated_incident BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE ticket_reply (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_ticket(id) ON DELETE CASCADE,
    author_name VARCHAR(120) NOT NULL,
    author_email VARCHAR(150) NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE alert_channel (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url VARCHAR(500) NULL,
    telegram_bot_token VARCHAR(200) NULL,
    telegram_chat_id VARCHAR(100) NULL,
    custom_headers TEXT NULL,
    events VARCHAR(250) NOT NULL DEFAULT 'down,up',
    last_dispatched_at TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE TABLE maintenance_window (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    website_ids TEXT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    suppress_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);`
  },
  {
    filename: 'seed.sql',
    language: 'sql',
    category: 'Backend',
    description: 'PostgreSQL seed script containing sample rows for websites, check logs, tickets, replies, and alert channels.',
    content: `-- PostgreSQL Seed Data for ChrisTech
INSERT INTO website (id, name, url, check_interval_minutes, keyword, is_active, created_at, ssl_issuer, ssl_expiry_days, ssl_expiry_date, domain_expiry_days, domain_expiry_date, domain_registrar)
VALUES
(1, 'Google Search Portal', 'https://www.google.com', 5, 'Google', TRUE, '2026-09-01 10:00:00', 'Google Trust Services LLC', 64, '2026-11-16', 720, '2028-09-15', 'MarkMonitor Inc.'),
(2, 'GitHub Cloud Hub', 'https://github.com', 5, NULL, TRUE, '2026-09-02 14:30:00', 'DigiCert High Assurance TLS', 28, '2026-10-11', 140, '2027-01-31', 'DNStination Inc.'),
(3, 'Legacy Microservice (Outage)', 'https://httpstat.us/503', 5, NULL, TRUE, '2026-09-05 09:15:00', 'Let''s Encrypt Authority X3', 5, '2026-09-18', 12, '2026-09-25', 'Namecheap Inc.'),
(4, 'Keyword Mismatch Test Probe', 'https://example.com', 5, 'MissingKeywordXYZ', TRUE, '2026-09-08 12:00:00', 'DigiCert Global Root G2', 94, '2026-12-16', 340, '2027-08-14', 'IANA / ICANN');

INSERT INTO check_log (id, website_id, is_up, status_code, response_time_ms, error_message, checked_at)
VALUES
(101, 1, TRUE, 200, 62, NULL, '2026-09-11 11:14:00'),
(201, 2, TRUE, 200, 135, NULL, '2026-09-11 11:10:00'),
(301, 3, FALSE, 503, 840, 'HTTP 503: Service Unavailable. Downstream backend timeout.', '2026-09-11 11:12:30'),
(401, 4, FALSE, 200, 110, 'Keyword ''MissingKeywordXYZ'' was not found in response HTML.', '2026-09-11 11:05:00');

INSERT INTO support_ticket (id, ticket_number, website_id, subject, description, requester_name, requester_email, category, priority, status, is_automated_incident, created_at, updated_at)
VALUES
(1, 'TICK-9041', 1, 'Intermittent 502 Bad Gateway during peak checkout hours', 'High latency seen from EU customers.', 'Sarah Jenkins', 's.jenkins@acme-corp.com', 'bug', 'high', 'in_progress', FALSE, '2026-09-10 14:22:00', '2026-09-11 09:15:00'),
(2, 'TICK-9042', 3, 'AUTOMATED INCIDENT: Legacy Microservice is DOWN', 'HTTP status 503 detected during probe check.', 'ChrisTech Sentinel Bot', 'sentinel-bot@christech.internal', 'outage', 'urgent', 'open', TRUE, '2026-09-11 11:12:30', '2026-09-11 11:12:30');`
  },
  {
    filename: 'seed_db.py',
    language: 'python',
    category: 'Backend',
    description: 'Python database seeder that automatically runs db.create_all() and seeds rows into PostgreSQL.',
    content: `from app import app, db
from seed_db import seed_database

if __name__ == '__main__':
    seed_database()`
  },
  {
    filename: 'SETUP.md',
    language: 'markdown',
    category: 'Documentation',
    description: 'Comprehensive installation instructions for PostgreSQL, virtual environments, and running app.py & scheduler.py.',
    content: `# ChrisTech Setup Guide
Step-by-step instructions to install PostgreSQL, configure .env, and run the Flask dashboard & scheduler.`
  }
];
