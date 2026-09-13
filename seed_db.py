"""
ChrisTech - Automated Database Seeder
====================================
This script creates all database tables and inserts initial sample rows
for websites, check logs, support tickets, replies, alert channels,
and maintenance windows.

Usage:
    python seed_db.py
"""

from datetime import datetime
from app import app, db, Website, CheckLog, SupportTicket, TicketReply, AlertChannel, MaintenanceWindow

def seed_database():
    with app.app_context():
        print("Creating all tables in database...")
        db.create_all()

        if Website.query.first():
            print("[INFO] Database already contains rows. Skipping duplicate insertion.")
            print(f"Websites count: {Website.query.count()}")
            print(f"Check logs count: {CheckLog.query.count()}")
            print(f"Tickets count: {SupportTicket.query.count()}")
            return

        print("Seeding initial websites...")
        w1 = Website(
            id=1,
            name='Google Search Portal',
            url='https://www.google.com',
            check_interval_minutes=5,
            keyword='Google',
            is_active=True,
            created_at=datetime(2026, 9, 1, 10, 0, 0),
            ssl_issuer='Google Trust Services LLC (GTS CA 1C3)',
            ssl_expiry_days=64,
            ssl_expiry_date='2026-11-16',
            domain_expiry_days=720,
            domain_expiry_date='2028-09-15',
            domain_registrar='MarkMonitor Inc.'
        )

        w2 = Website(
            id=2,
            name='GitHub Cloud Hub',
            url='https://github.com',
            check_interval_minutes=5,
            keyword=None,
            is_active=True,
            created_at=datetime(2026, 9, 2, 14, 30, 0),
            ssl_issuer='DigiCert High Assurance TLS Hybrid ECC SHA256 2020 CA1',
            ssl_expiry_days=28,
            ssl_expiry_date='2026-10-11',
            domain_expiry_days=140,
            domain_expiry_date='2027-01-31',
            domain_registrar='DNStination Inc.'
        )

        w3 = Website(
            id=3,
            name='Legacy Microservice (Outage)',
            url='https://httpstat.us/503',
            check_interval_minutes=5,
            keyword=None,
            is_active=True,
            created_at=datetime(2026, 9, 5, 9, 15, 0),
            ssl_issuer="Let's Encrypt Authority X3",
            ssl_expiry_days=5,
            ssl_expiry_date='2026-09-18',
            domain_expiry_days=12,
            domain_expiry_date='2026-09-25',
            domain_registrar='Namecheap Inc.'
        )

        w4 = Website(
            id=4,
            name='Keyword Mismatch Test Probe',
            url='https://example.com',
            check_interval_minutes=5,
            keyword='MissingKeywordXYZ',
            is_active=True,
            created_at=datetime(2026, 9, 8, 12, 0, 0),
            ssl_issuer='DigiCert Global Root G2',
            ssl_expiry_days=94,
            ssl_expiry_date='2026-12-16',
            domain_expiry_days=340,
            domain_expiry_date='2027-08-14',
            domain_registrar='IANA / ICANN'
        )

        db.session.add_all([w1, w2, w3, w4])
        db.session.flush()

        print("Seeding initial check logs...")
        logs = [
            # Site 1
            CheckLog(id=101, website_id=1, is_up=True, status_code=200, response_time_ms=62, checked_at=datetime(2026, 9, 11, 11, 14, 0)),
            CheckLog(id=102, website_id=1, is_up=True, status_code=200, response_time_ms=78, checked_at=datetime(2026, 9, 11, 11, 13, 0)),
            CheckLog(id=103, website_id=1, is_up=True, status_code=200, response_time_ms=55, checked_at=datetime(2026, 9, 11, 11, 12, 0)),
            # Site 2
            CheckLog(id=201, website_id=2, is_up=True, status_code=200, response_time_ms=135, checked_at=datetime(2026, 9, 11, 11, 10, 0)),
            CheckLog(id=202, website_id=2, is_up=True, status_code=200, response_time_ms=142, checked_at=datetime(2026, 9, 11, 11, 5, 0)),
            # Site 3 (Down)
            CheckLog(id=301, website_id=3, is_up=False, status_code=503, response_time_ms=840, error_message='HTTP 503: Service Unavailable. Downstream backend timeout.', checked_at=datetime(2026, 9, 11, 11, 12, 30)),
            CheckLog(id=302, website_id=3, is_up=False, status_code=503, response_time_ms=790, error_message='HTTP 503: Service Unavailable', checked_at=datetime(2026, 9, 11, 11, 10, 30)),
            # Site 4 (Keyword mismatch)
            CheckLog(id=401, website_id=4, is_up=False, status_code=200, response_time_ms=110, error_message="Keyword 'MissingKeywordXYZ' was not found in response HTML.", checked_at=datetime(2026, 9, 11, 11, 5, 0)),
            CheckLog(id=402, website_id=4, is_up=False, status_code=200, response_time_ms=104, error_message="Keyword 'MissingKeywordXYZ' was not found in response HTML.", checked_at=datetime(2026, 9, 11, 11, 0, 0))
        ]
        db.session.add_all(logs)

        print("Seeding initial support tickets...")
        t1 = SupportTicket(
            id=1,
            ticket_number='TICK-9041',
            website_id=1,
            subject='Intermittent 502 Bad Gateway during peak checkout hours',
            description='We are seeing sporadic 502 Bad Gateway errors reported by European customers between 14:00 and 16:00 UTC. Can support check the ingress proxy latency metrics?',
            requester_name='Sarah Jenkins',
            requester_email='s.jenkins@acme-corp.com',
            category='bug',
            priority='high',
            status='in_progress',
            is_automated_incident=False,
            created_at=datetime(2026, 9, 10, 14, 22, 0),
            updated_at=datetime(2026, 9, 11, 9, 15, 0)
        )

        t2 = SupportTicket(
            id=2,
            ticket_number='TICK-9042',
            website_id=3,
            subject='AUTOMATED INCIDENT: Legacy Microservice is DOWN',
            description='Synthetic health monitor detected HTTP status 503 (Service Unavailable. Downstream backend timeout.) during probe check.',
            requester_name='ChrisTech Sentinel Bot',
            requester_email='sentinel-bot@christech.internal',
            category='outage',
            priority='urgent',
            status='open',
            is_automated_incident=True,
            created_at=datetime(2026, 9, 11, 11, 12, 30),
            updated_at=datetime(2026, 9, 11, 11, 12, 30)
        )

        t3 = SupportTicket(
            id=3,
            ticket_number='TICK-9039',
            website_id=2,
            subject='Request for custom webhook alert format for Datadog integration',
            description='Our DevOps team would like to forward ChrisTech outage webhook payloads directly into Datadog incident monitors. Could you provide the JSON payload schema?',
            requester_name='Alex Rivera',
            requester_email='alex.r@cloudscale.io',
            category='general',
            priority='low',
            status='resolved',
            is_automated_incident=False,
            created_at=datetime(2026, 9, 8, 9, 0, 0),
            updated_at=datetime(2026, 9, 9, 16, 40, 0)
        )

        db.session.add_all([t1, t2, t3])
        db.session.flush()

        print("Seeding ticket replies...")
        r1 = TicketReply(
            id=1,
            ticket_id=1,
            author_name='Sarah Jenkins',
            author_email='s.jenkins@acme-corp.com',
            is_staff=False,
            is_internal_note=False,
            message='Here is the trace ID from the latest incident: trace-eu-84920482.',
            created_at=datetime(2026, 9, 10, 14, 35, 0)
        )
        r2 = TicketReply(
            id=2,
            ticket_id=1,
            author_name='Chris (Lead SRE)',
            author_email='support@christech.local',
            is_staff=True,
            is_internal_note=True,
            message='Internal Note: Checked Nginx upstream pool. Upstream node #3 has high memory consumption. Rotating pods now.',
            created_at=datetime(2026, 9, 11, 8, 30, 0)
        )
        r3 = TicketReply(
            id=3,
            ticket_id=1,
            author_name='Chris (Lead SRE)',
            author_email='support@christech.local',
            is_staff=True,
            is_internal_note=False,
            message='Hi Sarah, our SRE team identified a degraded container in the EU cluster worker pool and isolated the instance.',
            created_at=datetime(2026, 9, 11, 9, 15, 0)
        )
        db.session.add_all([r1, r2, r3])

        print("Seeding alert channels...")
        chan1 = AlertChannel(
            id='chan-1',
            type='slack',
            name='DevOps Primary Slack (#incidents)',
            enabled=True,
            webhook_url='https://hooks.slack.com/services/T04XX/B08YY/devops-alerts',
            events='down,up,ssl_expiring,maintenance',
            last_dispatched_at=datetime(2026, 9, 11, 11, 12, 30)
        )
        chan2 = AlertChannel(
            id='chan-2',
            type='discord',
            name='Engineering Discord (#outage-war-room)',
            enabled=True,
            webhook_url='https://discord.com/api/webhooks/1122334455/christech-sentinel',
            events='down,up',
            last_dispatched_at=datetime(2026, 9, 11, 11, 12, 30)
        )
        db.session.add_all([chan1, chan2])

        print("Seeding maintenance windows...")
        maint1 = MaintenanceWindow(
            id='maint-1',
            title='PostgreSQL 16 Engine Patch & Replica Failover',
            description='Scheduled rolling maintenance on production database instances.',
            website_ids='1,2',
            start_time='2026-09-14T02:00',
            end_time='2026-09-14T04:00',
            suppress_alerts=True,
            status='upcoming',
            created_at=datetime(2026, 9, 12, 14, 0, 0)
        )
        db.session.add(maint1)

        db.session.commit()
        print("✅ Database successfully seeded with sample rows!")

if __name__ == '__main__':
    seed_database()
