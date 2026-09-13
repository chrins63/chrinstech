# ⚡ ChrisTech - Self-Hosted Website Monitoring Tool
### Complete Step-by-Step Beginner Setup Guide

Welcome to **ChrisTech**! This guide will walk you through setting up Python, PostgreSQL, the database tables, and running both the Flask web dashboard and the background scheduler worker.

---

## 📁 Project Architecture & Components

| File | Purpose |
|---|---|
| `app.py` | The main Flask web server, SQLAlchemy models (`Website`, `CheckLog`), and dashboard routes. |
| `checker.py` | Contains the HTTP ping logic (10s timeout, status code check, keyword validation, error handling). |
| `notifier.py` | Formats and sends SMTP email alerts when a website transitions from UP→DOWN or DOWN→UP. |
| `scheduler.py` | Standalone background process using `APScheduler` that checks active sites on their schedule. |
| `templates/` | Jinja2 HTML templates styled with a modern dark theme (`base.html`, `dashboard.html`, etc.). |
| `requirements.txt`| Python package dependencies list. |
| `.env` | Local configuration for database credentials, secrets, and SMTP settings. |

---

## 🛠️ Step 1: System Prerequisites

Ensure you have Python 3.9+ installed on your system:

```bash
python3 --version
```

---

## 🐘 Step 2: Install PostgreSQL & Create the Database

### Option A: Ubuntu / Debian Linux
```bash
# 1. Update package list and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 2. Start and enable the PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Log into PostgreSQL as the 'postgres' superuser
sudo -u postgres psql
```

Inside the `psql` prompt, run the following SQL commands:
```sql
-- Create the database
CREATE DATABASE christech_db;

-- Create a dedicated user with a secure password
CREATE USER christech_user WITH ENCRYPTED PASSWORD 'MySecurePassword123!';

-- Grant privileges to the user on the database
GRANT ALL PRIVILEGES ON DATABASE christech_db TO christech_user;

-- Exit the psql prompt
\q
```

### Option B: macOS (Homebrew)
```bash
# 1. Install PostgreSQL via Homebrew
brew install postgresql@15

# 2. Start PostgreSQL service
brew services start postgresql@15

# 3. Create database
createdb christech_db

# 4. Connect and set a password if needed
psql postgres
```

### Option C: Windows
1. Download the official PostgreSQL installer from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).
2. Run the wizard, set a password for the `postgres` user, and leave port as `5432`.
3. Open **pgAdmin** or the **SQL Shell (psql)** and run:
   ```sql
   CREATE DATABASE christech_db;
   ```

> 💡 **Quick SQLite Tip for Instant Testing:**
> If you don't have PostgreSQL installed right now and want to test ChrisTech immediately, set `USE_SQLITE=true` in your `.env` file. ChrisTech will automatically use a local SQLite file (`christech.db`) without requiring any database server!

### 📊 Creating Tables & Populating Sample Rows in PostgreSQL

You have two easy options to create the tables and insert initial database rows:

#### Option 1: Using the provided SQL files directly in `psql`
```bash
# 1. Create all tables, indexes, and foreign keys
psql -U christech_user -d christech_db -f schema.sql

# 2. Insert initial sample rows (websites, check logs, tickets, replies, alert channels, maintenance windows)
psql -U christech_user -d christech_db -f seed.sql
```

#### Option 2: Using the Python Seeder Script
```bash
# Runs SQLAlchemy db.create_all() and inserts the initial records automatically
python seed_db.py
```

---

## 🐍 Step 3: Set Up a Python Virtual Environment

It is best practice in Python to use a virtual environment to keep dependencies isolated:

```bash
# 1. Navigate to the project directory
cd christech

# 2. Create virtual environment named 'venv'
python3 -m venv venv

# 3. Activate the virtual environment
# On Linux / macOS:
source venv/bin/activate

# On Windows (Command Prompt):
venv\Scripts\activate.bat
# Or Windows (PowerShell):
venv\Scripts\Activate.ps1
```

Once activated, your terminal prompt will show `(venv)`.

---

## 📦 Step 4: Install Python Dependencies

With your virtual environment activated:

```bash
pip install -r requirements.txt
```

This installs:
- `Flask` (Web framework)
- `Flask-SQLAlchemy` (ORM for database operations)
- `psycopg2-binary` (PostgreSQL driver for Python)
- `requests` (HTTP library for pinging websites)
- `APScheduler` (Background scheduler)
- `python-dotenv` (Loads `.env` configuration)

---

## ⚙️ Step 5: Configure the `.env` File

Copy the sample configuration file or edit `.env`:

```bash
cp .env.example .env
```

Open `.env` in your text editor and adjust the settings:

```env
# Database Credentials
DB_USER=christech_user
DB_PASSWORD=MySecurePassword123!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=christech_db

# Flask Secret Key (change to any random string in production)
SECRET_KEY=christech-super-secret-random-key-2026

# SMTP Email Alert Settings (Optional for initial tests)
# For Gmail: Use an App Password (Google Account -> Security -> App Passwords)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password
ALERT_RECIPIENT_EMAIL=your_personal_email@gmail.com
```

> **Note on Email Alerts:** If you leave `SMTP_EMAIL` blank, ChrisTech will print formatted simulated alerts to the terminal instead of failing, making it very easy to test!

---

## 🚀 Step 6: Run the Web Dashboard (`app.py`)

In your first terminal (with `venv` active):

```bash
python app.py
```

You will see:
```text
[ChrisTech] Database tables verified / created successfully.
🚀 [ChrisTech] Web Dashboard starting at http://localhost:5000
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

Open your browser and navigate to **`http://localhost:5000`**.
You will see the ChrisTech dark-themed monitoring dashboard!

---

## ⏱️ Step 7: Run the Background Scheduler (`scheduler.py`)

In a **second terminal** window:

```bash
# 1. Navigate to directory and activate virtual environment
cd christech
source venv/bin/activate

# 2. Run the scheduler process
python scheduler.py
```

You will see:
```text
=================================================================
⚡ ChrisTech Background Checker Scheduler
=================================================================
Monitoring engine starting up...
Checking frequency: Evaluates websites every 30 seconds.
Alerting rule: Alerts dispatch ONLY upon status change (anti-spam).
Press Ctrl+C to stop the scheduler.
=================================================================
🚀 [Scheduler] Running initial check cycle on startup...
```

The scheduler will now evaluate all active websites in the database according to their configured check intervals!

---

## 🧪 Step 8: Test Keyword Verification & Alerting

1. Click **"+ Add Website"** in the web dashboard.
2. Enter:
   - **Name**: `Google Search`
   - **URL**: `https://www.google.com`
   - **Interval**: `1` (check every 1 minute)
   - **Keyword**: `Google`
3. Click **"Save and Start Monitoring"**.
   - Notice the site is checked immediately and appears **UP** with response time.
4. Try adding a test site with an impossible keyword:
   - **Name**: `Failed Keyword Test`
   - **URL**: `https://example.com`
   - **Keyword**: `ThisWordDoesNotExist12345`
   - Result: Site will be marked **DOWN** with error: `"Keyword 'ThisWordDoesNotExist12345' was not found in response HTML."`
5. Observe that when status transitions (UP→DOWN or DOWN→UP), an email alert is sent!

---

## 🛡️ Production Deployment (systemd & Gunicorn)

For running ChrisTech 24/7 on a Linux server:

### 1. Install Gunicorn
```bash
pip install gunicorn
```

### 2. Create systemd service for the Web App (`/etc/systemd/system/christech-web.service`)
```ini
[Unit]
Description=ChrisTech Web Dashboard
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/christech
Environment="PATH=/home/ubuntu/christech/venv/bin"
ExecStart=/home/ubuntu/christech/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. Create systemd service for the Scheduler (`/etc/systemd/system/christech-scheduler.service`)
```ini
[Unit]
Description=ChrisTech Monitoring Scheduler
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/christech
Environment="PATH=/home/ubuntu/christech/venv/bin"
ExecStart=/home/ubuntu/christech/venv/bin/python scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Enable and start the services
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now christech-web.service
sudo systemctl enable --now christech-scheduler.service
```

---

**Congratulations!** You now have a resilient, self-hosted website monitoring tool running on Python (Flask) and PostgreSQL!
