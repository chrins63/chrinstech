import React, { useState } from 'react';
import { Database, Terminal, Check, Copy, Server, ShieldCheck, Mail, Cpu, Play } from 'lucide-react';

export const SetupGuideView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BookIcon className="w-4 h-4" />
          <span>Beginner-Friendly Setup Guide</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          How to Run ChrisTech with Python & PostgreSQL
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          ChrisTech runs as two collaborating processes: the <strong>Flask Web Dashboard (<code className="text-blue-300">app.py</code>)</strong> to manage websites and view uptime, and the <strong>Background Scheduler (<code className="text-blue-300">scheduler.py</code>)</strong> to ping endpoints and dispatch SMTP email alerts.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-3">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">1. Flask Dashboard (`app.py`)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Serves the dark-themed Jinja2 dashboard, handles website creation, deletion, and manual on-demand health checks.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-400 flex items-center justify-center mb-3">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">2. Scheduler (`scheduler.py`)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            APScheduler daemon running in a separate terminal. Pings active websites on interval and only alerts when status changes.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-400 flex items-center justify-center mb-3">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">3. PostgreSQL Database</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stores <code className="text-emerald-300">Website</code> targets and indexed <code className="text-emerald-300">CheckLog</code> history with foreign key cascade support.
          </p>
        </div>
      </div>

      {/* Step by Step Commands */}
      <div className="space-y-6">
        {/* Step 1: PostgreSQL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h2 className="text-base font-bold text-white">Create PostgreSQL Database</h2>
            </div>
            <button
              onClick={() => copyToClipboard(`CREATE DATABASE christech_db;\nCREATE USER christech_user WITH ENCRYPTED PASSWORD 'MySecurePassword123!';\nGRANT ALL PRIVILEGES ON DATABASE christech_db TO christech_user;`, 'sql-step')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md"
            >
              {copiedId === 'sql-step' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'sql-step' ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Connect to PostgreSQL via <code className="text-blue-300">psql</code> or pgAdmin and run:
          </p>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto">
            <div className="text-slate-500">-- Create database and dedicated user</div>
            <div className="text-blue-400">CREATE DATABASE <span className="text-white">christech_db</span>;</div>
            <div className="text-blue-400">CREATE USER <span className="text-white">christech_user</span> WITH ENCRYPTED PASSWORD <span className="text-emerald-300">'MySecurePassword123!'</span>;</div>
            <div className="text-blue-400">GRANT ALL PRIVILEGES ON DATABASE <span className="text-white">christech_db</span> TO <span className="text-white">christech_user</span>;</div>
          </div>
        </div>

        {/* Step 2: Virtualenv & Install */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h2 className="text-base font-bold text-white">Create Virtual Environment & Install Packages</h2>
            </div>
            <button
              onClick={() => copyToClipboard(`python3 -m venv venv\nsource venv/bin/activate\npip install -r requirements.txt`, 'venv-step')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md"
            >
              {copiedId === 'venv-step' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'venv-step' ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-200 overflow-x-auto space-y-1">
            <div className="text-slate-500"># 1. Create and activate Python virtual environment</div>
            <div>python3 -m venv venv</div>
            <div>source venv/bin/activate <span className="text-slate-500"># On Windows: venv\Scripts\activate</span></div>
            <div className="text-slate-500 pt-2"># 2. Install Flask, SQLAlchemy, psycopg2, requests, APScheduler</div>
            <div>pip install -r requirements.txt</div>
          </div>
        </div>

        {/* Step 3: Run app.py */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h2 className="text-base font-bold text-white">Start Web Dashboard (Terminal 1)</h2>
            </div>
            <button
              onClick={() => copyToClipboard(`python app.py`, 'app-step')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md"
            >
              {copiedId === 'app-step' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'app-step' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-200">
            <div>python app.py</div>
            <div className="text-emerald-400 mt-2">→ Database tables auto-created on first run!</div>
            <div className="text-slate-400">→ Web dashboard ready at: <span className="text-blue-400 underline">http://localhost:5000</span></div>
          </div>
        </div>

        {/* Step 4: Run scheduler.py */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
              <h2 className="text-base font-bold text-white">Start Background Scheduler (Terminal 2)</h2>
            </div>
            <button
              onClick={() => copyToClipboard(`python scheduler.py`, 'sched-step')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-md"
            >
              {copiedId === 'sched-step' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'sched-step' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-200">
            <div>python scheduler.py</div>
            <div className="text-slate-400 mt-2">→ Checks due websites according to each site's configured check interval.</div>
            <div className="text-slate-400">→ Anti-spam filter: only dispatches SMTP email alerts when status transitions (UP↔DOWN).</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
