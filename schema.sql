-- =============================================================================
-- ChrisTech Monitoring & Incident Platform - PostgreSQL Database Schema
-- =============================================================================
-- This script creates all tables, constraints, foreign keys, and indexes
-- required to run ChrisTech on a PostgreSQL 12+ database.
--
-- Usage:
--   psql -h localhost -U christech_user -d christech_db -f schema.sql
-- =============================================================================

-- Drop tables if re-initializing (in dependency order)
DROP TABLE IF EXISTS ticket_reply CASCADE;
DROP TABLE IF EXISTS support_ticket CASCADE;
DROP TABLE IF EXISTS check_log CASCADE;
DROP TABLE IF EXISTS maintenance_window CASCADE;
DROP TABLE IF EXISTS alert_channel CASCADE;
DROP TABLE IF EXISTS website CASCADE;

-- -----------------------------------------------------------------------------
-- Table: website
-- Core entity representing each monitored URL or service endpoint.
-- -----------------------------------------------------------------------------
CREATE TABLE website (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    url VARCHAR(500) NOT NULL,
    check_interval_minutes INTEGER NOT NULL DEFAULT 5,
    keyword VARCHAR(200) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    
    -- SSL Certificate & Domain Radar Metadata
    ssl_issuer VARCHAR(200) NULL,
    ssl_expiry_days INTEGER NULL,
    ssl_expiry_date VARCHAR(50) NULL,
    domain_expiry_days INTEGER NULL,
    domain_expiry_date VARCHAR(50) NULL,
    domain_registrar VARCHAR(200) NULL
);

CREATE INDEX idx_website_is_active ON website(is_active);
CREATE INDEX idx_website_created_at ON website(created_at DESC);

-- -----------------------------------------------------------------------------
-- Table: check_log
-- Historical probe records capturing HTTP status code, latency, and errors.
-- -----------------------------------------------------------------------------
CREATE TABLE check_log (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES website(id) ON DELETE CASCADE,
    is_up BOOLEAN NOT NULL,
    status_code INTEGER NULL,
    response_time_ms INTEGER NULL,
    error_message TEXT NULL,
    checked_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX idx_check_log_website_id ON check_log(website_id);
CREATE INDEX idx_check_log_checked_at ON check_log(checked_at DESC);
CREATE INDEX idx_check_log_lookup ON check_log(website_id, checked_at DESC);

-- -----------------------------------------------------------------------------
-- Table: support_ticket
-- Unified ticketing for customer requests and automated outage incidents.
-- -----------------------------------------------------------------------------
CREATE TABLE support_ticket (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    website_id INTEGER NOT NULL REFERENCES website(id) ON DELETE CASCADE,
    subject VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    requester_name VARCHAR(120) NOT NULL,
    requester_email VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- 'outage', 'performance', 'bug', 'billing', 'general'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(30) NOT NULL DEFAULT 'open',      -- 'open', 'in_progress', 'waiting', 'resolved', 'closed'
    is_automated_incident BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX idx_support_ticket_number ON support_ticket(ticket_number);
CREATE INDEX idx_support_ticket_website_id ON support_ticket(website_id);
CREATE INDEX idx_support_ticket_status ON support_ticket(status);
CREATE INDEX idx_support_ticket_priority ON support_ticket(priority);

-- -----------------------------------------------------------------------------
-- Table: ticket_reply
-- Conversation thread entries, customer responses, and staff internal notes.
-- -----------------------------------------------------------------------------
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

CREATE INDEX idx_ticket_reply_ticket_id ON ticket_reply(ticket_id);
CREATE INDEX idx_ticket_reply_created_at ON ticket_reply(created_at ASC);

-- -----------------------------------------------------------------------------
-- Table: alert_channel
-- Configured dispatch endpoints (Slack, Discord, Telegram, Webhook).
-- -----------------------------------------------------------------------------
CREATE TABLE alert_channel (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(30) NOT NULL, -- 'slack', 'discord', 'telegram', 'webhook'
    name VARCHAR(150) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url VARCHAR(500) NULL,
    telegram_bot_token VARCHAR(200) NULL,
    telegram_chat_id VARCHAR(100) NULL,
    custom_headers TEXT NULL,
    events VARCHAR(250) NOT NULL DEFAULT 'down,up',
    last_dispatched_at TIMESTAMP WITHOUT TIME ZONE NULL
);

-- -----------------------------------------------------------------------------
-- Table: maintenance_window
-- Scheduled maintenance periods with automated alert suppression.
-- -----------------------------------------------------------------------------
CREATE TABLE maintenance_window (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    website_ids TEXT NULL, -- Comma-separated website IDs, or empty for all
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    suppress_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'in_progress', 'completed'
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);
