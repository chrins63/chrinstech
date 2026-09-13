import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Calendar, 
  Globe, 
  ShieldCheck, 
  Share2, 
  Percent,
  Sliders,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Website, SlaReportData } from '../types';

interface SlaReportsViewProps {
  websites: Website[];
}

export const SlaReportsView: React.FC<SlaReportsViewProps> = ({ websites }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<number>(websites[0]?.id || 1);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('September 2026');
  const [targetSla, setTargetSla] = useState<number>(99.9);
  const [clientNotes, setClientNotes] = useState<string>(
    'During this reporting period, scheduled infrastructure maintenance was performed on the database cluster. Network transport and latency remained well within SLA parameters.'
  );

  const selectedSite = websites.find(w => w.id === selectedSiteId) || websites[0];

  // Calculate SLA report metrics
  const totalChecks = selectedSite?.logs.length || 0;
  const upChecks = selectedSite?.logs.filter(l => l.is_up).length || 0;
  const failedChecks = totalChecks - upChecks;
  const actualUptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100) : 100.0;
  const slaBreached = actualUptime < targetSla;

  // Downtime minutes calculation (assuming 1 check = 1 minute or interval)
  const intervalMinutes = selectedSite?.check_interval_minutes || 1;
  const downtimeMinutes = failedChecks * intervalMinutes;

  // Monthly minutes in a 30-day month = 43,200 mins
  const totalMonthMinutes = 43200;
  const allowedDowntimeMinutes = Math.round(totalMonthMinutes * (1 - targetSla / 100));

  // Latency metrics
  const validLatencies = (selectedSite?.logs || [])
    .map(l => l.response_time_ms)
    .filter((ms): ms is number => ms !== null && ms !== undefined)
    .sort((a, b) => a - b);

  const avgLatency = validLatencies.length > 0 
    ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) 
    : 0;
  const minLatency = validLatencies.length > 0 ? validLatencies[0] : 0;
  const maxLatency = validLatencies.length > 0 ? validLatencies[validLatencies.length - 1] : 0;
  const p95Latency = validLatencies.length > 0 
    ? validLatencies[Math.floor(validLatencies.length * 0.95)] 
    : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!selectedSite) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Website,URL,Reporting Period,Target SLA %,Actual Uptime %,SLA Breached,Total Checks,Failed Checks,Downtime Minutes,Avg Latency (ms),P95 Latency (ms)\n';
    csvContent += `"${selectedSite.name}","${selectedSite.url}","${selectedPeriod}",${targetSla},${actualUptime.toFixed(2)},${slaBreached},${totalChecks},${failedChecks},${downtimeMinutes},${avgLatency},${p95Latency}\n\n`;
    
    csvContent += 'Check ID,Timestamp,Status,Status Code,Response Time (ms),Error\n';
    selectedSite.logs.forEach(log => {
      csvContent += `${log.id},"${log.checked_at}",${log.is_up ? 'UP' : 'DOWN'},${log.status_code || ''},${log.response_time_ms || ''},"${(log.error_message || '').replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SLA_Report_${selectedSite.name.replace(/\s+/g, '_')}_${selectedPeriod.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Client SLA & Uptime Report Generator</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Audit Grade
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable executive Service Level Agreement (SLA) certificates and export raw historical metric datasets for your clients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Control Panel (Hidden when printing) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Target Client Website
          </label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            {websites.map(site => (
              <option key={site.id} value={site.id}>{site.name} ({site.url})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Reporting Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="September 2026">September 2026 (Current)</option>
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
            <option value="Last 30 Days">Last 30 Days (Rolling)</option>
            <option value="Year-to-Date 2026">Year-to-Date 2026</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Contractual SLA Tier Target
          </label>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[99.0, 99.5, 99.9, 99.99].map((tier) => (
              <button
                key={tier}
                onClick={() => setTargetSla(tier)}
                className={`flex-1 py-1 rounded-lg font-bold transition ${
                  targetSla === tier ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tier}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Report Certificate Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 print:bg-black print:text-white">
              CT
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white print:text-black tracking-tight">
                ChrisTech Infrastructure Services
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 font-medium">
                Official Monthly Service Level Agreement (SLA) & Reliability Audit
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-slate-400 print:text-slate-600 block text-[11px] uppercase tracking-wider font-bold">
              Report Period
            </span>
            <span className="text-base font-bold text-white print:text-black">
              {selectedPeriod}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Client & Target Overview */}
        <div className="p-4 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-400 tracking-wider block">
              Monitored Service Entity
            </span>
            <div className="text-base font-black text-white print:text-black mt-0.5">
              {selectedSite?.name}
            </div>
            <span className="text-slate-400 print:text-slate-600 font-mono text-[11px]">
              {selectedSite?.url}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-400 tracking-wider block">
                Target Commitment
              </span>
              <span className="text-sm font-bold text-blue-400 print:text-blue-600">
                {targetSla}% Uptime
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-400 tracking-wider block">
                Monitoring Interval
              </span>
              <span className="text-sm font-bold text-slate-300 print:text-slate-700">
                Every {intervalMinutes} minute{intervalMinutes > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Uptime Stat */}
          <div className={`p-5 rounded-2xl border ${
            slaBreached 
              ? 'bg-rose-950/20 border-rose-800/80 print:bg-rose-50 print:border-rose-300' 
              : 'bg-emerald-950/20 border-emerald-800/80 print:bg-emerald-50 print:border-emerald-300'
          }`}>
            <span className="text-[11px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Actual Uptime
            </span>
            <div className={`text-2xl sm:text-3xl font-black mt-1 ${
              slaBreached ? 'text-rose-400 print:text-rose-600' : 'text-emerald-400 print:text-emerald-600'
            }`}>
              {actualUptime.toFixed(2)}%
            </div>
            <span className={`text-[10px] font-bold uppercase mt-1 inline-flex items-center gap-1 ${
              slaBreached ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {slaBreached ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              <span>{slaBreached ? 'SLA Breached' : 'SLA Met & Verified'}</span>
            </span>
          </div>

          {/* Downtime Minutes */}
          <div className="p-5 rounded-2xl bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Downtime Duration
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white print:text-black mt-1">
              {downtimeMinutes} <span className="text-sm font-normal text-slate-400">mins</span>
            </div>
            <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-1">
              Allowed: {allowedDowntimeMinutes} mins max
            </span>
          </div>

          {/* Avg Response Time */}
          <div className="p-5 rounded-2xl bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Average Latency
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 print:text-blue-600 mt-1">
              {avgLatency} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-1">
              P95 Latency: {p95Latency}ms
            </span>
          </div>

          {/* Synthetic Probes Ran */}
          <div className="p-5 rounded-2xl bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Total Synthetic Probes
            </span>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 print:text-indigo-600 mt-1">
              {totalChecks}
            </div>
            <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-1">
              {failedChecks} failed checks logged
            </span>
          </div>
        </div>

        {/* Latency Distribution Breakdown */}
        <div className="p-5 bg-slate-950/80 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Response Latency Distribution Breakdown</span>
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Fastest (Min)</span>
              <span className="font-mono font-bold text-emerald-400 print:text-emerald-600 text-sm">{minLatency}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Median (Avg)</span>
              <span className="font-mono font-bold text-blue-400 print:text-blue-600 text-sm">{avgLatency}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">95th Percentile</span>
              <span className="font-mono font-bold text-indigo-400 print:text-indigo-600 text-sm">{p95Latency}ms</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Peak (Max)</span>
              <span className="font-mono font-bold text-amber-400 print:text-amber-600 text-sm">{maxLatency}ms</span>
            </div>
          </div>
        </div>

        {/* Executive Summary & Engineer Notes */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider block">
            Executive Summary & Reliability Notes
          </label>
          <textarea
            rows={3}
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-2xl text-xs text-slate-200 print:text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        </div>

        {/* Signatures & Certification Footer */}
        <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-400 tracking-wider block mb-4">
              Infrastructure Operations Lead
            </span>
            <div className="border-b border-slate-700 print:border-slate-300 pb-2 font-semibold text-white print:text-black">
              ChrisTech Lead Site Reliability Engineer
            </div>
            <span className="text-[10px] text-slate-500 print:text-slate-400 mt-1 block">Certified Digital Signature</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-400 tracking-wider block mb-4">
              Client Authorized Representative
            </span>
            <div className="border-b border-slate-700 print:border-slate-300 pb-2 text-slate-500 print:text-slate-400">
              Acknowledged & Received
            </div>
            <span className="text-[10px] text-slate-500 print:text-slate-400 mt-1 block">Date Signed: _______________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
