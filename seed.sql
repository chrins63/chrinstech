-- =============================================================================
-- ChrisTech Monitoring & Incident Platform - PostgreSQL Seed Data
-- =============================================================================
-- Populates the database with initial sample rows for websites, check logs,
-- support tickets, replies, alert channels, and maintenance windows.
--
-- Usage:
--   psql -h localhost -U christech_user -d christech_db -f seed.sql
-- =============================================================================

-- Clean up any existing data in correct dependency order
TRUNCATE TABLE ticket_reply, support_ticket, check_log, maintenance_window, alert_channel, website RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Populate Websites
-- -----------------------------------------------------------------------------
INSERT INTO website (id, name, url, check_interval_minutes, keyword, is_active, created_at, ssl_issuer, ssl_expiry_days, ssl_expiry_date, domain_expiry_days, domain_expiry_date, domain_registrar)
VALUES
(
    1,
    'Google Search Portal',
    'https://www.google.com',
    5,
    'Google',
    TRUE,
    '2026-09-01 10:00:00',
    'Google Trust Services LLC (GTS CA 1C3)',
    64,
    '2026-11-16',
    720,
    '2028-09-15',
    'MarkMonitor Inc.'
),
(
    2,
    'GitHub Cloud Hub',
    'https://github.com',
    5,
    NULL,
    TRUE,
    '2026-09-02 14:30:00',
    'DigiCert High Assurance TLS Hybrid ECC SHA256 2020 CA1',
    28,
    '2026-10-11',
    140,
    '2027-01-31',
    'DNStination Inc.'
),
(
    3,
    'Legacy Microservice (Outage)',
    'https://httpstat.us/503',
    5,
    NULL,
    TRUE,
    '2026-09-05 09:15:00',
    'Let''s Encrypt Authority X3',
    5,
    '2026-09-18',
    12,
    '2026-09-25',
    'Namecheap Inc.'
),
(
    4,
    'Keyword Mismatch Test Probe',
    'https://example.com',
    5,
    'MissingKeywordXYZ',
    TRUE,
    '2026-09-08 12:00:00',
    'DigiCert Global Root G2',
    94,
    '2026-12-16',
    340,
    '2027-08-14',
    'IANA / ICANN'
);

-- Reset sequence for website table
SELECT setval('website_id_seq', (SELECT MAX(id) FROM website));

-- -----------------------------------------------------------------------------
-- 2. Populate Check Logs
-- -----------------------------------------------------------------------------
INSERT INTO check_log (id, website_id, is_up, status_code, response_time_ms, error_message, checked_at)
VALUES
-- Site 1: Google Search Portal (UP)
(101, 1, TRUE, 200, 62, NULL, '2026-09-11 11:14:00'),
(102, 1, TRUE, 200, 78, NULL, '2026-09-11 11:13:00'),
(103, 1, TRUE, 200, 55, NULL, '2026-09-11 11:12:00'),
(104, 1, TRUE, 200, 68, NULL, '2026-09-11 11:11:00'),
(105, 1, TRUE, 200, 72, NULL, '2026-09-11 11:10:00'),

-- Site 2: GitHub Cloud Hub (UP)
(201, 2, TRUE, 200, 135, NULL, '2026-09-11 11:10:00'),
(202, 2, TRUE, 200, 142, NULL, '2026-09-11 11:05:00'),
(203, 2, TRUE, 200, 128, NULL, '2026-09-11 11:00:00'),
(204, 2, TRUE, 200, 131, NULL, '2026-09-11 10:55:00'),

-- Site 3: Legacy Microservice (DOWN - HTTP 503)
(301, 3, FALSE, 503, 840, 'HTTP 503: Service Unavailable. Downstream backend timeout.', '2026-09-11 11:12:30'),
(302, 3, FALSE, 503, 790, 'HTTP 503: Service Unavailable', '2026-09-11 11:10:30'),
(303, 3, FALSE, 503, 820, 'HTTP 503: Service Unavailable', '2026-09-11 11:08:30'),

-- Site 4: Keyword Mismatch Probe (DOWN - Missing Keyword)
(401, 4, FALSE, 200, 110, 'Keyword ''MissingKeywordXYZ'' was not found in response HTML.', '2026-09-11 11:05:00'),
(402, 4, FALSE, 200, 104, 'Keyword ''MissingKeywordXYZ'' was not found in response HTML.', '2026-09-11 11:00:00'),
(403, 4, TRUE, 200, 98, NULL, '2026-09-11 10:55:00');

SELECT setval('check_log_id_seq', (SELECT MAX(id) FROM check_log));

-- -----------------------------------------------------------------------------
-- 3. Populate Support Tickets
-- -----------------------------------------------------------------------------
INSERT INTO support_ticket (id, ticket_number, website_id, subject, description, requester_name, requester_email, category, priority, status, is_automated_incident, created_at, updated_at)
VALUES
(
    1,
    'TICK-9041',
    1,
    'Intermittent 502 Bad Gateway during peak checkout hours',
    'We are seeing sporadic 502 Bad Gateway errors reported by European customers between 14:00 and 16:00 UTC. Can support check the ingress proxy latency metrics?',
    'Sarah Jenkins',
    's.jenkins@acme-corp.com',
    'bug',
    'high',
    'in_progress',
    FALSE,
    '2026-09-10 14:22:00',
    '2026-09-11 09:15:00'
),
(
    2,
    'TICK-9042',
    3,
    'AUTOMATED INCIDENT: Legacy Microservice is DOWN',
    'Synthetic health monitor detected HTTP status 503 (Service Unavailable. Downstream backend timeout.) during probe check.',
    'ChrisTech Sentinel Bot',
    'sentinel-bot@christech.internal',
    'outage',
    'urgent',
    'open',
    TRUE,
    '2026-09-11 11:12:30',
    '2026-09-11 11:12:30'
),
(
    3,
    'TICK-9039',
    2,
    'Request for custom webhook alert format for Datadog integration',
    'Our DevOps team would like to forward ChrisTech outage webhook payloads directly into Datadog incident monitors. Could you provide the JSON payload schema?',
    'Alex Rivera',
    'alex.r@cloudscale.io',
    'general',
    'low',
    'resolved',
    FALSE,
    '2026-09-08 09:00:00',
    '2026-09-09 16:40:00'
);

SELECT setval('support_ticket_id_seq', (SELECT MAX(id) FROM support_ticket));

-- -----------------------------------------------------------------------------
-- 4. Populate Ticket Conversation Replies
-- -----------------------------------------------------------------------------
INSERT INTO ticket_reply (id, ticket_id, author_name, author_email, is_staff, is_internal_note, message, created_at)
VALUES
(
    1,
    1,
    'Sarah Jenkins',
    's.jenkins@acme-corp.com',
    FALSE,
    FALSE,
    'Here is the trace ID from the latest incident: trace-eu-84920482. The connection reset seemed to originate around the load balancer tier.',
    '2026-09-10 14:35:00'
),
(
    2,
    1,
    'Chris (Lead SRE)',
    'support@christech.local',
    TRUE,
    TRUE,
    'Internal Note: Checked Nginx upstream pool. Upstream node #3 has high memory consumption and dropped connections. Rotating pods now.',
    '2026-09-11 08:30:00'
),
(
    3,
    1,
    'Chris (Lead SRE)',
    'support@christech.local',
    TRUE,
    FALSE,
    'Hi Sarah, our SRE team identified a degraded container in the EU cluster worker pool. We have isolated the instance and failover is operating normally. We will monitor closely during today''s peak.',
    '2026-09-11 09:15:00'
),
(
    4,
    3,
    'Chris (Support)',
    'support@christech.local',
    TRUE,
    FALSE,
    'Hi Alex, here is the standard JSON payload structure dispatched on DOWN / UP events. Documentation has also been updated in the deliverable docs.',
    '2026-09-09 16:40:00'
);

SELECT setval('ticket_reply_id_seq', (SELECT MAX(id) FROM ticket_reply));

-- -----------------------------------------------------------------------------
-- 5. Populate Multi-Channel Alert Integrations
-- -----------------------------------------------------------------------------
INSERT INTO alert_channel (id, type, name, enabled, webhook_url, telegram_bot_token, telegram_chat_id, custom_headers, events, last_dispatched_at)
VALUES
(
    'chan-1',
    'slack',
    'DevOps Primary Slack (#incidents)',
    TRUE,
    'https://hooks.slack.com/services/T04XX/B08YY/devops-alerts',
    NULL,
    NULL,
    NULL,
    'down,up,ssl_expiring,maintenance',
    '2026-09-11 11:12:30'
),
(
    'chan-2',
    'discord',
    'Engineering Discord (#outage-war-room)',
    TRUE,
    'https://discord.com/api/webhooks/1122334455/christech-sentinel',
    NULL,
    NULL,
    NULL,
    'down,up',
    '2026-09-11 11:12:30'
),
(
    'chan-3',
    'telegram',
    'Lead SRE Mobile On-Call Bot',
    TRUE,
    NULL,
    '682910394:AAHq_7xK-SentinelOpsKey',
    '-100849201948',
    NULL,
    'down,up,ssl_expiring,maintenance',
    NULL
),
(
    'chan-4',
    'webhook',
    'Enterprise PagerDuty & Datadog Relay',
    TRUE,
    'https://events.pagerduty.com/v2/enqueue',
    NULL,
    NULL,
    '{"Authorization": "Token token=pd_live_948201a"}',
    'down,up',
    NULL
);

-- -----------------------------------------------------------------------------
-- 6. Populate Scheduled Maintenance Windows
-- -----------------------------------------------------------------------------
INSERT INTO maintenance_window (id, title, description, website_ids, start_time, end_time, suppress_alerts, status, created_at)
VALUES
(
    'maint-1',
    'PostgreSQL 16 Engine Patch & Replica Failover',
    'Scheduled rolling maintenance on production database instances. Synthetic probes may record brief connection delays.',
    '1,2',
    '2026-09-14T02:00',
    '2026-09-14T04:00',
    TRUE,
    'upcoming',
    '2026-09-12 14:00:00'
);
