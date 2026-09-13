import React, { useState } from 'react';
import { 
  Globe, 
  Zap, 
  Trash2, 
  Clock, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Shield,
  Mail,
  History,
  Activity,
  Headphones,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Website, SupportTicket } from '../types';
import { diagnoseWebsiteError } from '../utils/errorDiagnostics';

interface DashboardViewProps {
  websites: Website[];
  tickets: SupportTicket[];
  onOpenAddModal: () => void;
  onOpenDetailModal: (website: Website) => void;
  onOpenAlertModal: (website: Website) => void;
  onOpenDiagnosticsModal: (website: Website) => void;
  onCheckNow: (id: number) => void;
  onDelete: (id: number) => void;
  onGoToSupport: (siteId?: number) => void;
  onOpenCreateTicketForSite: (siteId: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  websites,
  tickets,
  onOpenAddModal,
  onOpenDetailModal,
  onOpenAlertModal,
  onOpenDiagnosticsModal,
  onCheckNow,
  onDelete,
  onGoToSupport,
  onOpenCreateTicketForSite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Metrics
  const totalSites = websites.length;
  const upSites = websites.filter(w => w.is_active && w.logs[0]?.is_up).length;
  const downSites = websites.filter(w => w.is_active && w.logs[0] && !w.logs[0].is_up).length;
  const pausedSites = websites.filter(w => !w.is_active).length;

  const validResponseTimes = websites
    .filter(w => w.is_active && w.logs[0]?.is_up && w.logs[0]?.response_time_ms !== null)
    .map(w => w.logs[0].response_time_ms as number);

  const avgResponseTime = validResponseTimes.length > 0
    ? Math.round(validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length)
    : 0;

  const openTicketsCount = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const urgentTicketsCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

  // Filtered websites
  const filteredWebsites = websites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (site.keyword && site.keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Stat Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Endpoints</span>
            <div className="p-1.5 rounded-md bg-blue-600/10 text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{totalSites}</div>
            <div className="text-xs text-slate-500 mt-1">Configured in PostgreSQL</div>
          </div>
        </div>

        {/* Operational / UP */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Operational (UP)</span>
            <div className="p-1.5 rounded-md bg-emerald-600/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{upSites}</div>
            <div className="text-xs text-slate-500 mt-1">Passing health & keyword checks</div>
          </div>
        </div>

        {/* Outages / DOWN */}
        <div className={`bg-slate-900 border rounded-xl p-5 shadow-lg flex flex-col justify-between ${downSites > 0 ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-800/90'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Active Outages</span>
            <div className="p-1.5 rounded-md bg-rose-600/10 text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-extrabold tracking-tight ${downSites > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {downSites}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {downSites > 0 ? 'Urgent incidents triggered' : 'All systems normal'}
            </div>
          </div>
        </div>

        {/* Support Desk Status */}
        <div 
          onClick={() => onGoToSupport()}
          className="bg-slate-900 border border-slate-800/90 hover:border-blue-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="group-hover:text-blue-400 transition-colors">Support Desk</span>
            <div className="p-1.5 rounded-md bg-blue-600/10 text-blue-400">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {openTicketsCount}
                <span className="text-xs font-medium text-slate-500 ml-1.5">open</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {urgentTicketsCount > 0 ? (
                  <span className="text-rose-400 font-semibold">{urgentTicketsCount} urgent incident(s)</span>
                ) : (
                  <span>All websites covered</span>
                )}
              </div>
            </div>
            <span className="text-xs text-blue-400 group-hover:translate-x-0.5 transition-transform font-medium">
              View Desk &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Active Incident & Root Cause Triage Banner (Shown if there are active errors) */}
      {downSites > 0 && (
        <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border-2 border-rose-900/80 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Site Error Detected &bull; Root Cause Triage Active
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {downSites} Site{downSites !== 1 ? 's' : ''} Failing
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ChrisTech has pinpointed the origin layer and generated step-by-step fix commands for all failing targets.
                </p>
                
                {/* Micro-list of failing endpoints with their origin layer */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {websites.filter(w => w.is_active && w.logs[0] && !w.logs[0].is_up).map(failingSite => {
                    const diag = diagnoseWebsiteError(failingSite);
                    return (
                      <button
                        key={failingSite.id}
                        onClick={() => onOpenDiagnosticsModal(failingSite)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-rose-800/80 hover:border-rose-600 text-xs transition text-left group"
                      >
                        <span className="font-bold text-white group-hover:text-rose-300">{failingSite.name}:</span>
                        <span className="text-[11px] text-rose-400 font-mono font-semibold">
                          {diag ? diag.layerTitle.split('(')[0] : 'Error Detected'}
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>See Fix</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => {
                  const firstFailing = websites.find(w => w.is_active && w.logs[0] && !w.logs[0].is_up);
                  if (firstFailing) onOpenDiagnosticsModal(firstFailing);
                }}
                className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
              >
                <Wrench className="w-4 h-4" />
                <span>Open Diagnostic Root Cause Engine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {/* Actions Bar */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/30">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Monitored Websites</h2>
            <p className="text-xs text-slate-400">Live checks with 10s timeout, HTTP &lt; 400 validation, and keyword testing</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search websites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Add Website Button */}
            <button
              id="dashboard-add-site-btn"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Website</span>
            </button>
          </div>
        </div>

        {/* Websites Table */}
        {filteredWebsites.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No monitored websites found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {searchQuery ? 'No websites match your search query.' : 'Add your first website to start automated uptime monitoring and email alerting.'}
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Website Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Keyword Check</th>
                  <th className="py-3 px-4">Interval</th>
                  <th className="py-3 px-4">Response Time</th>
                  <th className="py-3 px-4">Uptime (50)</th>
                  <th className="py-3 px-4">Last Checked</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWebsites.map((site) => {
                  const latestLog = site.logs[0];
                  const totalLogs = site.logs.length;
                  const upLogs = site.logs.filter(l => l.is_up).length;
                  const uptimePercent = totalLogs > 0 ? ((upLogs / totalLogs) * 100).toFixed(1) : '100.0';

                  return (
                    <tr key={site.id} className="hover:bg-slate-800/25 transition-colors">
                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!site.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            PAUSED
                          </span>
                        ) : !latestLog ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            PENDING
                          </span>
                        ) : latestLog.is_up ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs shadow-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            UP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs shadow-rose-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            DOWN
                          </span>
                        )}
                      </td>

                      {/* Name & URL */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => onOpenDetailModal(site)}
                            className="text-left font-bold text-white hover:text-blue-400 transition-colors text-sm"
                          >
                            {site.name}
                          </button>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-400 text-[11px] font-mono truncate max-w-xs inline-flex items-center gap-1"
                          >
                            <span>{site.url}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {/* Error Origin & Quick Fix Badge */}
                          {(() => {
                            const siteDiagnosis = diagnoseWebsiteError(site);
                            if (!siteDiagnosis) return null;
                            return (
                              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => onOpenDiagnosticsModal(site)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/80 hover:bg-rose-900 transition shadow-xs"
                                  title="Error detected! Click to view origin layer and step-by-step fix guide"
                                >
                                  <Wrench className="w-2.5 h-2.5 text-rose-400" />
                                  <span>Origin: {siteDiagnosis.layerTitle.split('(')[0]}</span>
                                  <span className="text-[9px] text-blue-300 underline ml-0.5 font-sans">Fix Guide &rarr;</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* Linked Support Tickets Indicator */}
                          {(() => {
                            const siteTickets = tickets.filter(t => t.website_id === site.id && t.status !== 'resolved' && t.status !== 'closed');
                            const hasUrgent = siteTickets.some(t => t.priority === 'urgent');
                            if (siteTickets.length === 0) return null;
                            return (
                              <div className="mt-1 flex items-center gap-1">
                                <button
                                  onClick={() => onGoToSupport(site.id)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                                    hasUrgent
                                      ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60 hover:bg-rose-900/80'
                                      : 'bg-blue-950/70 text-blue-400 border border-blue-800/60 hover:bg-blue-900/80'
                                  }`}
                                >
                                  <Headphones className="w-2.5 h-2.5" />
                                  <span>{siteTickets.length} open ticket{siteTickets.length !== 1 ? 's' : ''}</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Keyword */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {site.keyword ? (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300 font-semibold">
                            "{site.keyword}"
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Interval */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        Every {site.check_interval_minutes}m
                      </td>

                      {/* Response Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                        {latestLog?.response_time_ms !== null && latestLog?.response_time_ms !== undefined ? (
                          <span className={latestLog.response_time_ms < 300 ? 'text-emerald-400' : latestLog.response_time_ms < 800 ? 'text-amber-400' : 'text-rose-400'}>
                            {latestLog.response_time_ms} ms
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">—</span>
                        )}
                      </td>

                      {/* Uptime % */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-mono font-bold ${Number(uptimePercent) >= 99 ? 'text-emerald-400' : Number(uptimePercent) >= 95 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {uptimePercent}%
                        </span>
                      </td>

                      {/* Last Checked */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {latestLog ? latestLog.checked_at : 'Never'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Error Diagnostics & Fix Suite */}
                          {(() => {
                            const siteDiagnosis = diagnoseWebsiteError(site);
                            return (
                              <button
                                onClick={() => onOpenDiagnosticsModal(site)}
                                title={siteDiagnosis ? `Diagnose failure origin (${siteDiagnosis.layerTitle}) & view fix commands` : "Open Root Cause & Remediation Engine"}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  siteDiagnosis
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/40 ring-1 ring-rose-400/50 animate-pulse'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}

                          {/* Check Now */}
                          <button
                            onClick={() => onCheckNow(site.id)}
                            title="Ping website right now"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* Email Preview */}
                          <button
                            onClick={() => onOpenAlertModal(site)}
                            title="Simulate / Preview SMTP Email Alert"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail Logs */}
                          <button
                            onClick={() => onOpenDetailModal(site)}
                            title="View last 50 check logs"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Log Support Ticket */}
                          <button
                            onClick={() => onOpenCreateTicketForSite(site.id)}
                            title="Log new support ticket for this site"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete '${site.name}'? This will remove all check logs permanently.`)) {
                                onDelete(site.id);
                              }
                            }}
                            title="Delete Website"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
