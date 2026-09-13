import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Calendar, 
  Bell, 
  ArrowLeft, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  Wrench,
  ChevronDown,
  ChevronUp,
  Share2,
  Check
} from 'lucide-react';
import { Website, SupportTicket, MaintenanceWindow } from '../types';

interface StatusPageViewProps {
  websites: Website[];
  tickets: SupportTicket[];
  maintenanceWindows: MaintenanceWindow[];
  onBackToAdmin?: () => void;
}

export const StatusPageView: React.FC<StatusPageViewProps> = ({
  websites,
  tickets,
  maintenanceWindows,
  onBackToAdmin
}) => {
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<number | 'all'>('all');
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedIncidentId, setExpandedIncidentId] = useState<number | null>(null);

  // Active sites
  const activeSites = websites.filter(w => w.is_active);
  const downSites = activeSites.filter(w => w.logs[0] && !w.logs[0].is_up);
  const activeMaintenance = maintenanceWindows.filter(m => m.status === 'in_progress');

  // Overall system status calculation
  let overallStatus: 'operational' | 'degraded' | 'outage' | 'maintenance' = 'operational';
  if (activeMaintenance.length > 0 && downSites.length === 0) {
    overallStatus = 'maintenance';
  } else if (downSites.length > 0 && downSites.length === activeSites.length && activeSites.length > 0) {
    overallStatus = 'outage';
  } else if (downSites.length > 0) {
    overallStatus = 'degraded';
  }

  // Calculate global 30-day average uptime
  const totalAllChecks = activeSites.reduce((acc, s) => acc + s.logs.length, 0);
  const totalAllUp = activeSites.reduce((acc, s) => acc + s.logs.filter(l => l.is_up).length, 0);
  const globalUptimePercent = totalAllChecks > 0 ? ((totalAllUp / totalAllChecks) * 100).toFixed(2) : '100.00';

  // Calculate average response time
  const totalResponseTimes = activeSites.reduce((acc, s) => {
    const valid = s.logs.filter(l => l.response_time_ms !== null);
    return acc + valid.reduce((sum, l) => sum + (l.response_time_ms || 0), 0);
  }, 0);
  const totalValidLogs = activeSites.reduce((acc, s) => acc + s.logs.filter(l => l.response_time_ms !== null).length, 0);
  const avgResponseTime = totalValidLogs > 0 ? Math.round(totalResponseTimes / totalValidLogs) : 0;

  // Recent unresolved or recently resolved incident tickets for public display
  const publicIncidents = tickets
    .filter(t => t.category === 'outage' || t.is_automated_incident)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    setSubscribeSuccess(true);
    setTimeout(() => {
      setSubscribeSuccess(false);
      setIsSubscribeOpen(false);
      setSubscribeEmail('');
    }, 2000);
  };

  // Generate 30 mock history days for visual timeline
  const generateTimelineDays = (site: Website) => {
    const days = [];
    const isCurrentlyDown = site.logs[0] && !site.logs[0].is_up;
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Today
      if (i === 0) {
        days.push({
          date: dateStr,
          status: isCurrentlyDown ? 'down' : 'up',
          uptime: isCurrentlyDown ? '92.4%' : '100%',
          hasIncident: isCurrentlyDown
        });
      } else if (i === 4 && site.id === 2) {
        // slight historic blip on staging
        days.push({
          date: dateStr,
          status: 'degraded',
          uptime: '97.2%',
          hasIncident: true
        });
      } else {
        days.push({
          date: dateStr,
          status: 'up',
          uptime: '100%',
          hasIncident: false
        });
      }
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              CT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-base">ChrisTech</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Live Status Page
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-Time Service Reliability & Incident Transparency</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
              title="Share status page link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => setIsSubscribeOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Subscribe</span>
            </button>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Console</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Global Hero Status Banner */}
        <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 shadow-xl ${
          overallStatus === 'operational'
            ? 'bg-emerald-950/40 border-emerald-800/60 shadow-emerald-950/20'
            : overallStatus === 'maintenance'
              ? 'bg-amber-950/40 border-amber-800/60 shadow-amber-950/20'
              : overallStatus === 'degraded'
                ? 'bg-amber-950/50 border-amber-700/60 shadow-amber-950/30'
                : 'bg-rose-950/60 border-rose-700/80 shadow-rose-950/40'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl flex items-center justify-center ${
                overallStatus === 'operational'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : overallStatus === 'maintenance'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : overallStatus === 'degraded'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
              }`}>
                {overallStatus === 'operational' && <CheckCircle2 className="w-8 h-8" />}
                {overallStatus === 'maintenance' && <Wrench className="w-8 h-8" />}
                {overallStatus === 'degraded' && <AlertTriangle className="w-8 h-8" />}
                {overallStatus === 'outage' && <XCircle className="w-8 h-8" />}
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {overallStatus === 'operational' && 'All Systems Fully Operational'}
                  {overallStatus === 'maintenance' && 'Scheduled Maintenance in Progress'}
                  {overallStatus === 'degraded' && 'Partial System Disruption Detected'}
                  {overallStatus === 'outage' && 'Major Outage Across Services'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {overallStatus === 'operational' && 'All core network endpoints, databases, and monitored client assets are passing synthetic health probes.'}
                  {overallStatus === 'maintenance' && 'Routine maintenance is active. Outage notifications are currently suppressed for maintenance targets.'}
                  {overallStatus === 'degraded' && `${downSites.length} of ${activeSites.length} services currently experiencing downtime. Engineering triage is active.`}
                  {overallStatus === 'outage' && 'All monitored network targets are currently failing. Immediate incident escalation in effect.'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Last Polled</span>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 sm:justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Just Now</span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Performance High-Level Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">30-Day Uptime</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {globalUptimePercent}%
            </div>
            <span className="text-[10px] text-slate-500">Across {activeSites.length} monitored nodes</span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Avg Latency</span>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
              {avgResponseTime}ms
            </div>
            <span className="text-[10px] text-slate-500">Global response time</span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Services Monitored</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {activeSites.length}
            </div>
            <span className="text-[10px] text-slate-500">{downSites.length} degraded/down</span>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Incidents (30d)</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">
              {publicIncidents.length}
            </div>
            <span className="text-[10px] text-slate-500">Public transparency log</span>
          </div>
        </div>

        {/* Active Maintenance Notice (If Any) */}
        {activeMaintenance.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Wrench className="w-4 h-4" />
              <span>Active Scheduled Maintenance Window</span>
            </div>
            {activeMaintenance.map(m => (
              <div key={m.id} className="text-xs text-slate-300">
                <span className="font-bold text-white">{m.title}:</span> {m.description}
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Window: {new Date(m.start_time).toLocaleString()} &mdash; {new Date(m.end_time).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Services & 30-Day Historical Activity Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">System & Service Reliability</h2>
              <p className="text-xs text-slate-400">Daily uptime metrics recorded over the last 30 days</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Operational</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Degraded</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Outage</span>
            </div>
          </div>

          {/* List of Monitored Services */}
          <div className="space-y-3">
            {activeSites.map(site => {
              const latestLog = site.logs[0];
              const isUp = latestLog ? latestLog.is_up : true;
              const totalChecks = site.logs.length;
              const upChecks = site.logs.filter(l => l.is_up).length;
              const siteUptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : '100.0';
              const timeline = generateTimelineDays(site);

              return (
                <div 
                  key={site.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4"
                >
                  {/* Service Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isUp ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 animate-pulse'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{site.name}</h3>
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-0.5"
                          >
                            <span>{site.url}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      {latestLog?.response_time_ms && (
                        <span className="text-slate-400 font-mono">
                          {latestLog.response_time_ms}ms
                        </span>
                      )}
                      <span className="font-bold text-emerald-400">
                        {siteUptime}% uptime
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isUp
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                      }`}>
                        {isUp ? 'Operational' : 'Outage'}
                      </span>
                    </div>
                  </div>

                  {/* 30-Day Timeline Bar */}
                  <div>
                    <div className="grid grid-cols-30 gap-1 sm:gap-1.5 h-8">
                      {timeline.map((day, idx) => (
                        <div
                          key={idx}
                          title={`${day.date}: ${day.uptime} (${day.status.toUpperCase()})`}
                          className={`rounded-sm transition-transform hover:scale-125 cursor-pointer ${
                            day.status === 'up'
                              ? 'bg-emerald-500/80 hover:bg-emerald-400'
                              : day.status === 'degraded'
                                ? 'bg-amber-500 hover:bg-amber-400'
                                : 'bg-rose-500 hover:bg-rose-400 animate-pulse'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                      <span>30 days ago</span>
                      <span>15 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Public Incident History & Post-Mortem Updates */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Incident Updates & Post-Mortems</h2>
              <p className="text-xs text-slate-400">Chronological history of recent platform anomalies and resolutions</p>
            </div>
          </div>

          {publicIncidents.length === 0 ? (
            <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Incidents Reported in the Last 30 Days</h3>
              <p className="text-xs text-slate-400 mt-1">All monitored nodes and systems maintained 100% operational integrity.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicIncidents.map(incident => {
                const isExpanded = expandedIncidentId === incident.id;
                const isResolved = incident.status === 'resolved' || incident.status === 'closed';

                return (
                  <div
                    key={incident.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md"
                  >
                    <div 
                      onClick={() => setExpandedIncidentId(isExpanded ? null : incident.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          isResolved 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                        }`}>
                          {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{incident.subject}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isResolved 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {isResolved ? 'Resolved' : 'Active Incident'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                            Logged: {new Date(incident.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span className="hidden sm:inline">{isExpanded ? 'Hide Details' : 'View Timeline'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-800 bg-slate-950/50 space-y-3">
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {incident.description}
                        </div>

                        {/* Public Incident Updates / Replies */}
                        {incident.replies && incident.replies.filter(r => !r.is_internal_note).length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Investigation Timeline
                            </span>
                            {incident.replies.filter(r => !r.is_internal_note).map(reply => (
                              <div key={reply.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="font-bold text-blue-400">{reply.author_name} (Support)</span>
                                  <span className="font-mono">{new Date(reply.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-200">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Subscribe to Outage Updates Modal */}
      {isSubscribeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Bell className="w-5 h-5 text-blue-400" />
                <span>Subscribe to Outage Alerts</span>
              </div>
              <button 
                onClick={() => setIsSubscribeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Receive automatic notifications when incidents are reported, updated, or resolved across any of our monitored services.
            </p>

            {subscribeSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center text-xs text-emerald-300 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <div className="font-bold">Subscription Confirmed!</div>
                <div className="text-[11px] text-slate-300">You will receive notifications at {subscribeEmail}.</div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubscribeOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    Confirm Subscription
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Powered by ChrisTech Automated Sentinel &bull; Incident Reliability Suite</span>
          <span>Security & Health Probes Executed Every 60 Seconds</span>
        </div>
      </footer>
    </div>
  );
};
