import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check, 
  Terminal, 
  ExternalLink, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Website } from '../types';

interface SslDomainRadarViewProps {
  websites: Website[];
  onRefreshCert: (websiteId: number) => void;
  onTriggerSslAlert?: (website: Website) => void;
}

export const SslDomainRadarView: React.FC<SslDomainRadarViewProps> = ({
  websites,
  onRefreshCert,
  onTriggerSslAlert
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Compute SSL status categories
  const getSslStatus = (days?: number) => {
    if (days === undefined) return { label: 'Unknown', color: 'slate', status: 'unknown' };
    if (days <= 0) return { label: 'Expired', color: 'rose', status: 'critical' };
    if (days <= 7) return { label: 'Expiring (<7d)', color: 'rose', status: 'critical' };
    if (days <= 30) return { label: 'Expiring (<30d)', color: 'amber', status: 'warning' };
    return { label: 'Valid & Healthy', color: 'emerald', status: 'healthy' };
  };

  const getDomainStatus = (days?: number) => {
    if (days === undefined) return { label: 'Unknown', color: 'slate' };
    if (days <= 14) return { label: 'Expires Soon', color: 'rose' };
    if (days <= 60) return { label: 'Renewal Approaching', color: 'amber' };
    return { label: 'Active', color: 'emerald' };
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Filtered sites
  const filteredWebsites = websites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          site.url.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const sslStat = getSslStatus(site.ssl_expiry_days);
    if (statusFilter === 'all') return true;
    return sslStat.status === statusFilter;
  });

  // Summary counts
  const criticalCount = websites.filter(w => (w.ssl_expiry_days ?? 99) <= 7).length;
  const warningCount = websites.filter(w => (w.ssl_expiry_days ?? 99) > 7 && (w.ssl_expiry_days ?? 99) <= 30).length;
  const healthyCount = websites.filter(w => (w.ssl_expiry_days ?? 99) > 30).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">SSL Certificate & Domain Expiry Radar</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Proactive Guardian
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detect certificate lapses and domain expiration before they cause client downtime. Automated alerts fire at 30, 14, and 7 days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
              {healthyCount} Healthy
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/80">
              {warningCount} &lt;30 Days
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/80">
              {criticalCount} Critical
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search domain or website name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({websites.length})
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'warning' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Warning ({warningCount})
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'healthy' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Healthy ({healthyCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Monitored Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWebsites.map(site => {
          const sslDays = site.ssl_expiry_days ?? 64;
          const sslDate = site.ssl_expiry_date || '2026-11-16';
          const sslIssuer = site.ssl_issuer || "Let's Encrypt Authority X3";
          const domainDays = site.domain_expiry_days ?? 180;
          const domainDate = site.domain_expiry_date || '2027-03-12';
          const registrar = site.domain_registrar || 'Cloudflare Registrar';

          const sslStat = getSslStatus(sslDays);
          const domainStat = getDomainStatus(domainDays);

          const domainHostname = site.url.replace(/^https?:\/\//, '').split('/')[0];
          const renewCmd = `sudo certbot certonly --force-renewal -d ${domainHostname}`;

          return (
            <div
              key={site.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-md space-y-4 ${
                sslStat.status === 'critical'
                  ? 'border-rose-800/80 bg-rose-950/10'
                  : sslStat.status === 'warning'
                    ? 'border-amber-800/80 bg-amber-950/10'
                    : 'border-slate-800'
              }`}
            >
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    sslStat.status === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : sslStat.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {sslStat.status === 'healthy' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{site.name}</h3>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 font-mono mt-0.5"
                    >
                      <span>{site.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRefreshCert(site.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Probe SSL Certificate Now"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  {onTriggerSslAlert && (
                    <button
                      onClick={() => onTriggerSslAlert(site)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Simulate SSL notification dispatch"
                    >
                      Test Alert
                    </button>
                  )}
                </div>
              </div>

              {/* SSL vs Domain Dual Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* SSL Box */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SSL Certificate</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      sslStat.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : sslStat.status === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {sslStat.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-black ${
                      sslStat.status === 'critical' ? 'text-rose-400' : sslStat.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {sslDays}
                    </span>
                    <span className="text-slate-400 text-xs">days left</span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-900">
                    <div>Expires: <span className="text-slate-300 font-mono">{sslDate}</span></div>
                    <div className="truncate">CA: <span className="text-slate-300 font-medium">{sslIssuer}</span></div>
                  </div>
                </div>

                {/* Domain Expiry Box */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Domain Renewal</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {domainStat.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">
                      {domainDays}
                    </span>
                    <span className="text-slate-400 text-xs">days left</span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-900">
                    <div>Renews: <span className="text-slate-300 font-mono">{domainDate}</span></div>
                    <div className="truncate">Registrar: <span className="text-slate-300 font-medium">{registrar}</span></div>
                  </div>
                </div>
              </div>

              {/* Actionable Certbot Command Toolbar */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Quick Renewal Command</span>
                  </span>
                  <button
                    onClick={() => handleCopy(renewCmd)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedCmd === renewCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === renewCmd ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 truncate">
                  {renewCmd}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
