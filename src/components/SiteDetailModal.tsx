import React from 'react';
import { 
  X, 
  Globe, 
  Zap, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Wrench,
  Layers,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { Website } from '../types';
import { diagnoseWebsiteError } from '../utils/errorDiagnostics';

interface SiteDetailModalProps {
  website: Website | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckNow: (id: number) => void;
  onToggleActive: (id: number) => void;
  onOpenDiagnosticsModal?: (website: Website) => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  website,
  isOpen,
  onClose,
  onCheckNow,
  onToggleActive,
  onOpenDiagnosticsModal
}) => {
  if (!isOpen || !website) return null;

  const totalChecks = website.logs.length;
  const upChecks = website.logs.filter(l => l.is_up).length;
  const uptimePercent = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : '100.0';
  const latestLog = website.logs[0];
  const diagnosis = diagnoseWebsiteError(website, latestLog);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        id="site-detail-modal"
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              !website.is_active
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : latestLog?.is_up
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {!website.is_active ? '⏸' : latestLog?.is_up ? 'UP' : 'DN'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{website.name}</h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  !website.is_active
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : latestLog?.is_up
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {!website.is_active ? 'Paused' : latestLog?.is_up ? 'Operational' : 'Down'}
                </span>
              </div>
              <a 
                href={website.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 mt-0.5"
              >
                <span>{website.url}</span>
                <Globe className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="detail-check-now-btn"
              onClick={() => onCheckNow(website.id)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Check Now</span>
            </button>
            <button
              id="detail-toggle-active-btn"
              onClick={() => onToggleActive(website.id)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              {website.is_active ? 'Pause' : 'Resume'}
            </button>
            <button
              id="close-detail-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-950/30 border-b border-slate-800/80">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Uptime (Last 50)</div>
            <div className={`text-xl font-extrabold ${Number(uptimePercent) >= 99 ? 'text-emerald-400' : Number(uptimePercent) >= 95 ? 'text-amber-400' : 'text-rose-400'}`}>
              {uptimePercent}%
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Latest Latency</div>
            <div className="text-xl font-extrabold text-white font-mono">
              {latestLog?.response_time_ms !== null && latestLog?.response_time_ms !== undefined ? `${latestLog.response_time_ms} ms` : '—'}
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Interval Cadence</div>
            <div className="text-xl font-extrabold text-slate-200">
              {website.check_interval_minutes} <span className="text-xs text-slate-400 font-normal">min</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Keyword Match</div>
            <div className="text-sm font-mono font-bold text-blue-400 truncate">
              {website.keyword ? `"${website.keyword}"` : <span className="text-slate-500 font-normal">None</span>}
            </div>
          </div>
        </div>

        {/* Live Root Cause Diagnostic & Fix Guide Banner (Shown when site has an error) */}
        {diagnosis && (
          <div className="p-6 bg-rose-950/20 border-b border-rose-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-600/30">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Active Error Detected &bull; Root Cause Analysis</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold border border-rose-700/60">
                      {diagnosis.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ChrisTech detected a failure during the last health ping.
                  </p>
                </div>
              </div>

              {onOpenDiagnosticsModal && (
                <button
                  onClick={() => onOpenDiagnosticsModal(website)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Open Full Diagnostic & Fix Suite</span>
                </button>
              )}
            </div>

            {/* Where is it coming from vs How to fix it side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Where is it coming from */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Where is it coming from?</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Origin Layer:</span>
                  <span className="font-bold text-white">{diagnosis.layerTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Source Component:</span>
                  <span className="font-mono text-rose-300 font-semibold">{diagnosis.sourceComponent}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Root Cause:</span>
                  <p className="text-slate-300 leading-relaxed">{diagnosis.rootCause}</p>
                </div>
              </div>

              {/* How to fix it */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>How to fix it:</span>
                </div>
                <div className="space-y-1.5">
                  {diagnosis.remediationSteps.slice(0, 3).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">&bull;</span>
                      <span className="text-slate-200">{step}</span>
                    </div>
                  ))}
                </div>
                {diagnosis.remediationCommands.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-cyan-400" />
                      <span>Primary Server Command:</span>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      {diagnosis.remediationCommands[0].split('\n')[0]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Check History Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Last 50 Checks Log</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">{website.logs.length} check entries</span>
          </div>

          {website.logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No check logs recorded yet. Click "Check Now" to perform the first ping!
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">HTTP Code</th>
                    <th className="py-2.5 px-3.5">Latency</th>
                    <th className="py-2.5 px-3.5">Diagnostic / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {website.logs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {log.checked_at}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {log.is_up ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> UP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> DOWN
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold">
                        {log.status_code ? (
                          <span className={log.status_code < 400 ? 'text-emerald-400' : 'text-rose-400'}>
                            {log.status_code}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono">
                        {log.response_time_ms !== null ? (
                          <span className={log.response_time_ms < 300 ? 'text-emerald-400' : log.response_time_ms < 800 ? 'text-amber-400' : 'text-rose-400'}>
                            {log.response_time_ms} ms
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-300">
                        {log.error_message ? (
                          (() => {
                            const logDiag = diagnoseWebsiteError(website, log);
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-rose-400 font-mono text-[11px] flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0 text-rose-500" />
                                  <span>{log.error_message}</span>
                                </span>
                                {logDiag && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-800/80 font-semibold">
                                      Origin: {logDiag.layerTitle.split('(')[0]}
                                    </span>
                                    {onOpenDiagnosticsModal && (
                                      <button
                                        onClick={() => onOpenDiagnosticsModal(website)}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
                                      >
                                        How to fix &rarr;
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-slate-500">Healthy</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
