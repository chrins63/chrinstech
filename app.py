"""
ChrisTech - Self-Hosted Website Monitoring Tool
==============================================
Main Flask application containing database models, configuration,
and web dashboard routes.

Beginner Guide:
- Flask is a lightweight Python web framework that routes web requests to Python functions.
- SQLAlchemy is an Object-Relational Mapper (ORM) that translates Python classes (Models)
  into SQL database tables and rows without writing raw SQL.
- Jinja2 is the templating engine Flask uses to render dynamic HTML pages.
"""

import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy

# Load environment variables from .env file into Python's os.environ
load_dotenv()

# Initialize Flask application
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'christech-dev-secret-key-replace-in-prod')

# -----------------------------------------------------------------------------
# Database Configuration (PostgreSQL via SQLAlchemy)
# -----------------------------------------------------------------------------
# We read the database connection settings from the .env file.
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'christech_db')

# Direct DATABASE_URL (for Cloud / Heroku / Supabase style configs) or constructed URL
custom_database_url = os.getenv('DATABASE_URL')
if custom_database_url:
    # Some providers like Heroku use postgres:// which SQLAlchemy 1.4+ expects as postgresql://
    if custom_database_url.startswith("postgres://"):
        custom_database_url = custom_database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = custom_database_url
else:
    # Build standard PostgreSQL connection string: postgresql://username:password@host:port/database_name
    # Note: If you want to test without PostgreSQL installed, you can set USE_SQLITE=true in .env
    if os.getenv('USE_SQLITE', 'false').lower() in ('true', '1', 'yes'):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///christech.db'
        print("[ChrisTech] Running with SQLite fallback (christech.db)")
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with our Flask app
db = SQLAlchemy(app)


# -----------------------------------------------------------------------------
# Database Models
# -----------------------------------------------------------------------------
class Website(db.Model):
    """
    Website Model:
    Represents a website being monitored by ChrisTech.
    Maps to the 'website' table in PostgreSQL.
    """
    __tablename__ = 'website'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    check_interval_minutes = db.Column(db.Integer, default=5, nullable=False)
    # Optional keyword to verify inside the HTML body (e.g., "Welcome", "API OK")
    keyword = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # SSL & Domain Radar tracking
    ssl_issuer = db.Column(db.String(200), nullable=True)
    ssl_expiry_days = db.Column(db.Integer, nullable=True)
    ssl_expiry_date = db.Column(db.String(50), nullable=True)
    domain_expiry_days = db.Column(db.Integer, nullable=True)
    domain_expiry_date = db.Column(db.String(50), nullable=True)
    domain_registrar = db.Column(db.String(200), nullable=True)

    # One-to-Many Relationship: Each website has many CheckLog entries.
    # cascade='all, delete-orphan' ensures that if a website is deleted, all its check logs are deleted too.
    check_logs = db.relationship(
        'CheckLog',
        backref='website',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='desc(CheckLog.checked_at)'
    )

    # One-to-Many Relationship: Support tickets filed for this website
    support_tickets = db.relationship(
        'SupportTicket',
        backref='website',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='desc(SupportTicket.created_at)'
    )

    @property
    def latest_log(self):
        """Returns the most recent CheckLog record for this site, or None."""
        return self.check_logs.first()

    @property
    def open_tickets_count(self):
        """Count of active/open support tickets for this website."""
        return self.support_tickets.filter(SupportTicket.status.notin_(['resolved', 'closed'])).count()

    @property
    def urgent_tickets_count(self):
        """Count of urgent open support tickets for this website."""
        return self.support_tickets.filter(
            SupportTicket.priority == 'urgent',
            SupportTicket.status.notin_(['resolved', 'closed'])
        ).count()

    @property
    def status(self):
        """
        Calculates the human-friendly current status:
        - 'UP': The last check succeeded
        - 'DOWN': The last check failed
        - 'PAUSED': Monitoring is paused
        - 'PENDING': Added recently, no check recorded yet
        """
        if not self.is_active:
            return 'PAUSED'
        last = self.latest_log
        if not last:
            return 'PENDING'
        return 'UP' if last.is_up else 'DOWN'

    @property
    def uptime_percentage(self):
        """
        Calculates uptime percentage over the last 100 checks.
        Returns a float formatted to 1 decimal place (e.g. 99.5), or 100.0 if no logs exist.
        """
        logs = self.check_logs.limit(100).all()
        if not logs:
            return 100.0
        up_count = sum(1 for log in logs if log.is_up)
        return round((up_count / len(logs)) * 100.0, 1)

    def __repr__(self):
        return f"<Website {self.name} ({self.url})>"


class CheckLog(db.Model):
    """
    CheckLog Model:
    Stores the result of each uptime ping/check.
    Maps to the 'check_log' table in PostgreSQL.
    """
    __tablename__ = 'check_log'

    id = db.Column(db.Integer, primary_key=True)
    website_id = db.Column(db.Integer, db.ForeignKey('website.id'), nullable=False, index=True)
    is_up = db.Column(db.Boolean, nullable=False)
    status_code = db.Column(db.Integer, nullable=True)         # HTTP status code (e.g., 200, 404, 500)
    response_time_ms = db.Column(db.Integer, nullable=True)    # Ping / response duration in milliseconds
    error_message = db.Column(db.Text, nullable=True)          # Detailed error message if check failed
    checked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        status = "UP" if self.is_up else "DOWN"
        return f"<CheckLog site_id={self.website_id} status={status} code={self.status_code}>"


class SupportTicket(db.Model):
    """
    SupportTicket Model:
    Represents an inquiry, bug report, customer issue, or automated outage incident
    for a specific website created by the user.
    Maps to the 'support_ticket' table in PostgreSQL.
    """
    __tablename__ = 'support_ticket'

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    website_id = db.Column(db.Integer, db.ForeignKey('website.id', ondelete='CASCADE'), nullable=False, index=True)
    subject = db.Column(db.String(250), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requester_name = db.Column(db.String(120), nullable=False)
    requester_email = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), default='general', nullable=False)   # outage, bug, performance, billing, general
    priority = db.Column(db.String(20), default='medium', nullable=False)    # low, medium, high, urgent
    status = db.Column(db.String(30), default='open', nullable=False)       # open, in_progress, waiting, resolved, closed
    is_automated_incident = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to conversation replies and internal staff notes
    replies = db.relationship(
        'TicketReply',
        backref='ticket',
        lazy='dynamic',
        cascade='all, delete-orphan',
        order_by='TicketReply.created_at.asc()'
    )

    @property
    def replies_count(self):
        return self.replies.count()

    def __repr__(self):
        return f"<SupportTicket {self.ticket_number} - {self.subject} ({self.status})>"


class TicketReply(db.Model):
    """
    TicketReply Model:
    Stores conversation thread messages, customer responses, and staff internal notes.
    Maps to the 'ticket_reply' table in PostgreSQL.
    """
    __tablename__ = 'ticket_reply'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_ticket.id', ondelete='CASCADE'), nullable=False, index=True)
    author_name = db.Column(db.String(120), nullable=False)
    author_email = db.Column(db.String(150), nullable=True)
    is_staff = db.Column(db.Boolean, default=False, nullable=False)
    is_internal_note = db.Column(db.Boolean, default=False, nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TicketReply id={self.id} ticket_id={self.ticket_id} by={self.author_name}>"


class AlertChannel(db.Model):
    """
    AlertChannel Model:
    Configures notification destinations (Slack, Discord, Telegram, Webhook).
    Maps to the 'alert_channel' table in PostgreSQL.
    """
    __tablename__ = 'alert_channel'

    id = db.Column(db.String(50), primary_key=True)
    type = db.Column(db.String(30), nullable=False)          # 'slack', 'discord', 'telegram', 'webhook'
    name = db.Column(db.String(150), nullable=False)
    enabled = db.Column(db.Boolean, default=True, nullable=False)
    webhook_url = db.Column(db.String(500), nullable=True)
    telegram_bot_token = db.Column(db.String(200), nullable=True)
    telegram_chat_id = db.Column(db.String(100), nullable=True)
    custom_headers = db.Column(db.Text, nullable=True)       # JSON string or headers
    events = db.Column(db.String(250), default='down,up', nullable=False)  # comma-separated event triggers
    last_dispatched_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<AlertChannel {self.name} ({self.type})>"


class MaintenanceWindow(db.Model):
    """
    MaintenanceWindow Model:
    Defines planned downtime or system update intervals with alert suppression.
    Maps to the 'maintenance_window' table in PostgreSQL.
    """
    __tablename__ = 'maintenance_window'

    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    website_ids = db.Column(db.Text, nullable=True)          # Comma-separated website IDs, or empty for all
    start_time = db.Column(db.String(50), nullable=False)
    end_time = db.Column(db.String(50), nullable=False)
    suppress_alerts = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(30), default='upcoming', nullable=False)  # 'upcoming', 'in_progress', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<MaintenanceWindow {self.title} [{self.status}]>"


# -----------------------------------------------------------------------------
# Database Initializer Helper
# -----------------------------------------------------------------------------
def init_db():
    """Creates the database tables if they do not exist yet."""
    with app.app_context():
        try:
            db.create_all()
            print("[ChrisTech] Database tables verified / created successfully.")
        except Exception as e:
            print(f"[ChrisTech ERROR] Failed to initialize database: {e}")
            print("Tip: Make sure PostgreSQL is running and credentials in .env are correct.")


# -----------------------------------------------------------------------------
# Web Dashboard Routes
# -----------------------------------------------------------------------------

@app.route('/')
def dashboard():
    """
    Home page:
    Renders the monitoring dashboard with summary metrics and
    a table of all monitored websites.
    """
    websites = Website.query.order_by(Website.created_at.desc()).all()

    # Calculate aggregate metrics for top summary cards
    total_sites = len(websites)
    up_sites = sum(1 for w in websites if w.status == 'UP')
    down_sites = sum(1 for w in websites if w.status == 'DOWN')
    paused_sites = sum(1 for w in websites if w.status == 'PAUSED')

    # Calculate average response time across active sites that are currently UP
    response_times = [
        w.latest_log.response_time_ms
        for w in websites
        if w.latest_log and w.latest_log.response_time_ms is not None and w.status == 'UP'
    ]
    avg_response_time = round(sum(response_times) / len(response_times)) if response_times else 0

    return render_template(
        'dashboard.html',
        websites=websites,
        total_sites=total_sites,
        up_sites=up_sites,
        down_sites=down_sites,
        paused_sites=paused_sites,
        avg_response_time=avg_response_time
    )


@app.route('/add', methods=['GET', 'POST'])
def add_website():
    """
    Add Website Page:
    GET: Displays the web form to register a new website to monitor.
    POST: Validates inputs, saves to PostgreSQL, and triggers an immediate first check.
    """
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        url = request.form.get('url', '').strip()
        interval = request.form.get('check_interval_minutes', '5').strip()
        keyword = request.form.get('keyword', '').strip() or None

        # Input validation
        if not name or not url:
            flash('Both Site Name and URL are required.', 'danger')
            return render_template('add_website.html', name=name, url=url, interval=interval, keyword=keyword)

        # Ensure URL starts with http:// or https://
        if not (url.startswith('http://') or url.startswith('https://')):
            url = 'https://' + url

        try:
            interval_int = int(interval)
            if interval_int < 1:
                interval_int = 1
        except ValueError:
            interval_int = 5

        # Create new Website record
        new_site = Website(
            name=name,
            url=url,
            check_interval_minutes=interval_int,
            keyword=keyword,
            is_active=True
        )

        try:
            db.session.add(new_site)
            db.session.commit()

            # Trigger an immediate check so the user immediately sees the status!
            try:
                from checker import check_website_and_log
                check_website_and_log(new_site.id, send_alert_if_changed=False)
            except Exception as check_err:
                print(f"[ChrisTech] First check skipped or error: {check_err}")

            flash(f"Website '{name}' was successfully added to monitoring!", 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error saving website to database: {e}", 'danger')
            return render_template('add_website.html', name=name, url=url, interval=interval, keyword=keyword)

    return render_template('add_website.html')


@app.route('/website/<int:website_id>')
def site_detail(website_id):
    """
    Site Detail Page:
    Shows the last 50 checks for a specific website in chronological order,
    including response times, status codes, and error details.
    """
    website = Website.query.get_or_404(website_id)
    # Query last 50 checks
    recent_checks = website.check_logs.limit(50).all()

    return render_template(
        'site_detail.html',
        website=website,
        recent_checks=recent_checks
    )


@app.route('/website/<int:website_id>/check-now', methods=['POST'])
def check_now(website_id):
    """
    Triggers an immediate manual check for a website and redirects back.
    Useful for testing URLs and keyword matches on demand.
    """
    website = Website.query.get_or_404(website_id)
    try:
        from checker import check_website_and_log
        log = check_website_and_log(website.id, send_alert_if_changed=True)
        if log.is_up:
            flash(f"Check completed: '{website.name}' is UP! (HTTP {log.status_code}, {log.response_time_ms}ms)", 'success')
        else:
            flash(f"Check completed: '{website.name}' is DOWN! ({log.error_message})", 'warning')
    except Exception as e:
        flash(f"Failed to check website: {e}", 'danger')

    # Return to the referring page (either detail or dashboard)
    return redirect(request.referrer or url_for('dashboard'))


@app.route('/website/<int:website_id>/toggle', methods=['POST'])
def toggle_website(website_id):
    """Pauses or resumes monitoring for a website."""
    website = Website.query.get_or_404(website_id)
    website.is_active = not website.is_active
    db.session.commit()
    state = "resumed" if website.is_active else "paused"
    flash(f"Monitoring for '{website.name}' has been {state}.", 'info')
    return redirect(request.referrer or url_for('dashboard'))


@app.route('/website/<int:website_id>/delete', methods=['POST'])
def delete_website(website_id):
    """
    Deletes a website and all associated check logs.
    Includes database transaction safety.
    """
    website = Website.query.get_or_404(website_id)
    site_name = website.name
    try:
        db.session.delete(website)
        db.session.commit()
        flash(f"Website '{site_name}' and all its history have been deleted.", 'info')
    except Exception as e:
        db.session.rollback()
        flash(f"Could not delete website: {e}", 'danger')

    return redirect(url_for('dashboard'))


# -----------------------------------------------------------------------------
# Context Processor (Global template variables across all Jinja2 pages)
# -----------------------------------------------------------------------------
@app.context_processor
def inject_global_metrics():
    """Injects open ticket count and monitored sites count to base.html navbar."""
    try:
        total_open_tickets = SupportTicket.query.filter(
            SupportTicket.status.notin_(['resolved', 'closed'])
        ).count()
        urgent_tickets_count = SupportTicket.query.filter(
            SupportTicket.priority == 'urgent',
            SupportTicket.status.notin_(['resolved', 'closed'])
        ).count()
        total_sites_count = Website.query.count()
    except Exception:
        total_open_tickets = 0
        urgent_tickets_count = 0
        total_sites_count = 0

    return {
        'nav_open_tickets': total_open_tickets,
        'nav_urgent_tickets': urgent_tickets_count,
        'nav_sites_count': total_sites_count
    }


# -----------------------------------------------------------------------------
# Support Desk & Ticketing Routes
# -----------------------------------------------------------------------------
@app.route('/support')
def support_dashboard():
    """
    Support Desk Home:
    View and filter support tickets across all monitored websites.
    Filters: website_id, status, priority, category, search text (q).
    """
    websites = Website.query.order_by(Website.name.asc()).all()

    # Query params
    site_id = request.args.get('site_id', type=int)
    status_filter = request.args.get('status', '').strip()
    priority_filter = request.args.get('priority', '').strip()
    category_filter = request.args.get('category', '').strip()
    search_q = request.args.get('q', '').strip()

    # Base query
    query = SupportTicket.query

    if site_id:
        query = query.filter(SupportTicket.website_id == site_id)
    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)
    if priority_filter:
        query = query.filter(SupportTicket.priority == priority_filter)
    if category_filter:
        query = query.filter(SupportTicket.category == category_filter)
    if search_q:
        search_pattern = f"%{search_q}%"
        query = query.filter(
            db.or_(
                SupportTicket.subject.ilike(search_pattern),
                SupportTicket.ticket_number.ilike(search_pattern),
                SupportTicket.requester_name.ilike(search_pattern),
                SupportTicket.requester_email.ilike(search_pattern),
                SupportTicket.description.ilike(search_pattern)
            )
        )

    tickets = query.order_by(
        db.case(
            (SupportTicket.priority == 'urgent', 1),
            (SupportTicket.priority == 'high', 2),
            (SupportTicket.priority == 'medium', 3),
            else_=4
        ),
        SupportTicket.created_at.desc()
    ).all()

    # Calculate aggregate support stats
    total_tickets = SupportTicket.query.count()
    open_tickets = SupportTicket.query.filter(SupportTicket.status == 'open').count()
    in_progress_tickets = SupportTicket.query.filter(SupportTicket.status == 'in_progress').count()
    urgent_tickets = SupportTicket.query.filter(
        SupportTicket.priority == 'urgent',
        SupportTicket.status.notin_(['resolved', 'closed'])
    ).count()
    resolved_tickets = SupportTicket.query.filter(SupportTicket.status.in_(['resolved', 'closed'])).count()
    resolution_rate = round((resolved_tickets / total_tickets * 100), 1) if total_tickets > 0 else 100.0

    return render_template(
        'support.html',
        tickets=tickets,
        websites=websites,
        selected_site_id=site_id,
        selected_status=status_filter,
        selected_priority=priority_filter,
        selected_category=category_filter,
        search_query=search_q,
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress_tickets,
        urgent_tickets=urgent_tickets,
        resolved_tickets=resolved_tickets,
        resolution_rate=resolution_rate
    )


@app.route('/support/new', methods=['GET', 'POST'])
def new_ticket():
    """
    Create a new support ticket:
    Used by internal staff or directly within the admin dashboard to file tickets against any website.
    """
    websites = Website.query.order_by(Website.name.asc()).all()

    if request.method == 'POST':
        website_id = request.form.get('website_id', type=int)
        requester_name = request.form.get('requester_name', '').strip()
        requester_email = request.form.get('requester_email', '').strip()
        category = request.form.get('category', 'general').strip()
        priority = request.form.get('priority', 'medium').strip()
        subject = request.form.get('subject', '').strip()
        description = request.form.get('description', '').strip()

        if not website_id or not requester_name or not requester_email or not subject or not description:
            flash('Please fill in all required fields to submit the support ticket.', 'danger')
            return render_template(
                'new_ticket.html',
                websites=websites,
                website_id=website_id,
                requester_name=requester_name,
                requester_email=requester_email,
                category=category,
                priority=priority,
                subject=subject,
                description=description
            )

        # Generate ticket identifier
        timestamp_suffix = int(datetime.utcnow().timestamp()) % 100000
        ticket_number = f"CT-{timestamp_suffix:05d}"

        ticket = SupportTicket(
            ticket_number=ticket_number,
            website_id=website_id,
            subject=subject,
            description=description,
            requester_name=requester_name,
            requester_email=requester_email,
            category=category,
            priority=priority,
            status='open',
            is_automated_incident=False
        )

        try:
            db.session.add(ticket)
            db.session.commit()
            flash(f"Support ticket #{ticket.ticket_number} created successfully for '{ticket.website.name}'!", 'success')
            return redirect(url_for('ticket_detail', ticket_id=ticket.id))
        except Exception as e:
            db.session.rollback()
            flash(f"Failed to create support ticket: {e}", 'danger')

    preselected_site_id = request.args.get('website_id', type=int)
    return render_template('new_ticket.html', websites=websites, preselected_site_id=preselected_site_id)


@app.route('/support/<int:ticket_id>')
def ticket_detail(ticket_id):
    """
    View ticket conversation, status, priority, and staff notes.
    """
    ticket = SupportTicket.query.get_or_404(ticket_id)
    replies = ticket.replies.all()
    return render_template('ticket_detail.html', ticket=ticket, replies=replies)


@app.route('/support/<int:ticket_id>/reply', methods=['POST'])
def add_ticket_reply(ticket_id):
    """
    Appends a conversation message or internal staff note to a support ticket.
    Optionally updates the ticket status (e.g., to In Progress or Resolved).
    """
    ticket = SupportTicket.query.get_or_404(ticket_id)
    author_name = request.form.get('author_name', 'Support Team').strip() or 'Support Team'
    author_email = request.form.get('author_email', '').strip() or None
    message = request.form.get('message', '').strip()
    is_internal_note = request.form.get('is_internal_note') == 'true'
    new_status = request.form.get('update_status', '').strip()

    if not message:
        flash('Reply message cannot be empty.', 'warning')
        return redirect(url_for('ticket_detail', ticket_id=ticket.id))

    reply = TicketReply(
        ticket_id=ticket.id,
        author_name=author_name,
        author_email=author_email,
        is_staff=True,
        is_internal_note=is_internal_note,
        message=message,
        created_at=datetime.utcnow()
    )

    ticket.updated_at = datetime.utcnow()
    if new_status and new_status in ['open', 'in_progress', 'waiting', 'resolved', 'closed']:
        ticket.status = new_status

    try:
        db.session.add(reply)
        db.session.commit()
        note_type = "Internal note" if is_internal_note else "Reply"
        flash(f"{note_type} added successfully!", 'success')
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to post reply: {e}", 'danger')

    return redirect(url_for('ticket_detail', ticket_id=ticket.id))


@app.route('/support/<int:ticket_id>/status', methods=['POST'])
def update_ticket_status(ticket_id):
    """Updates status or priority of a ticket."""
    ticket = SupportTicket.query.get_or_404(ticket_id)
    status = request.form.get('status')
    priority = request.form.get('priority')

    if status and status in ['open', 'in_progress', 'waiting', 'resolved', 'closed']:
        ticket.status = status
    if priority and priority in ['low', 'medium', 'high', 'urgent']:
        ticket.priority = priority

    ticket.updated_at = datetime.utcnow()
    db.session.commit()
    flash(f"Ticket #{ticket.ticket_number} updated.", 'info')
    return redirect(url_for('ticket_detail', ticket_id=ticket.id))


@app.route('/support/portal/<int:website_id>', methods=['GET', 'POST'])
def public_support_portal(website_id):
    """
    Public Customer Support Portal for a specific website:
    Can be shared with clients or visitors of the monitored site to report bugs or request help.
    """
    website = Website.query.get_or_404(website_id)

    if request.method == 'POST':
        requester_name = request.form.get('name', '').strip()
        requester_email = request.form.get('email', '').strip()
        subject = request.form.get('subject', '').strip()
        category = request.form.get('category', 'general').strip()
        description = request.form.get('message', '').strip()

        if not requester_name or not requester_email or not subject or not description:
            flash('Please complete all form fields.', 'danger')
            return render_template('public_portal.html', website=website)

        timestamp_suffix = int(datetime.utcnow().timestamp()) % 100000
        ticket_number = f"CT-{timestamp_suffix:05d}"

        ticket = SupportTicket(
            ticket_number=ticket_number,
            website_id=website.id,
            subject=subject,
            description=description,
            requester_name=requester_name,
            requester_email=requester_email,
            category=category,
            priority='medium',
            status='open',
            is_automated_incident=False
        )

        try:
            db.session.add(ticket)
            db.session.commit()
            return render_template('public_portal.html', website=website, submitted_ticket=ticket)
        except Exception as e:
            db.session.rollback()
            flash(f"Failed to submit ticket: {e}", 'danger')

    return render_template('public_portal.html', website=website)


@app.route('/api/support/submit', methods=['POST'])
def api_submit_ticket():
    """
    CORS-friendly JSON API endpoint for external web pages and the embeddable support widget.
    Allows any website created by the user to submit tickets straight into ChrisTech.
    """
    data = request.get_json(silent=True) or request.form.to_dict()

    website_id = data.get('website_id')
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()
    category = data.get('category', 'general').strip()
    priority = data.get('priority', 'medium').strip()

    if not website_id or not name or not email or not subject or not message:
        return jsonify({'error': 'Missing required fields (website_id, name, email, subject, message)'}), 400

    website = Website.query.get(website_id)
    if not website:
        return jsonify({'error': f'Monitored website with ID {website_id} not found'}), 404

    timestamp_suffix = int(datetime.utcnow().timestamp()) % 100000
    ticket_number = f"CT-{timestamp_suffix:05d}"

    ticket = SupportTicket(
        ticket_number=ticket_number,
        website_id=website.id,
        subject=subject,
        description=message,
        requester_name=name,
        requester_email=email,
        category=category,
        priority=priority,
        status='open',
        is_automated_incident=False
    )

    try:
        db.session.add(ticket)
        db.session.commit()
        response = jsonify({
            'success': True,
            'ticket_number': ticket.ticket_number,
            'message': 'Support ticket received successfully. Our team will review it shortly.'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500


# -----------------------------------------------------------------------------
# Application Runner
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    # Initialize DB tables when running standalone
    init_db()
    # Run development Flask server
    # Port 5000 is traditional for Flask, or 3000 if configured
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', 'true').lower() in ('true', '1')
    print(f"🚀 [ChrisTech] Web Dashboard starting at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
