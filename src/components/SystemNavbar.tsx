import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Wrench,
  FileText,
  Headphones,
  Radio,
  Globe,
  Sparkles,
  Code2,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TabType, Website, SupportTicket, MaintenanceWindow } from '../types';

interface SystemNavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  websites: Website[];
  tickets: SupportTicket[];
  maintenanceWindows: MaintenanceWindow[];
  onOpenAddSite: () => void;
}

export const SystemNavbar: React.FC<SystemNavbarProps> = ({
  activeTab,
  onSelectTab,
  websites,
  tickets,
  maintenanceWindows,
  onOpenAddSite
}) => {
  // Dropdown states
  const [isOpsOpen, setIsOpsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for click outside detection
  const opsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Metrics
  const openTicketsTotal = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const urgentTicketsTotal = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;
  const inProgressMaintenanceCount = maintenanceWindows.filter(m => m.status === 'in_progress').length;
  const expiringSslCount = websites.filter(w => (w.ssl_expiry_days ?? 999) <= 30).length;
  
  // Overall health status
  const totalSites = websites.length;
  const downSitesCount = websites.filter(w => {
    const latest = w.logs?.[0];
    return latest && !latest.is_up;
  }).length;
  const isHealthy = downSitesCount === 0;

  // Active section detection
  const isOpsActive = ['status-page', 'ssl-radar', 'maintenance', 'sla-reports'].includes(activeTab);
  const isToolsActive = ['public-portal', 'widget-studio', 'code-explorer', 'setup-guide'].includes(activeTab);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opsRef.current && !opsRef.current.contains(event.target as Node)) {
        setIsOpsOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: TabType) => {
    onSelectTab(tab);
    setIsOpsOpen(false);
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleTabClick('monitoring')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="ChrisTech Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-extrabold text-base transition-transform group-hover:scale-105">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">ChrisTech</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                  Sentinel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block leading-tight">Uptime & Support Command</p>
            </div>
          </button>
        </div>

        {/* Center: Streamlined Primary Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          
          {/* 1. Monitoring Dashboard */}
          <button
            id="nav-tab-monitoring"
            onClick={() => handleTabClick('monitoring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'monitoring'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Monitoring</span>
          </button>

          {/* 2. Operations Dropdown */}
          <div className="relative" ref={opsRef}>
            <button
              id="nav-dropdown-ops"
              onClick={() => {
                setIsOpsOpen(!isOpsOpen);
                setIsToolsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isOpsActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Operations</span>
              {(expiringSslCount > 0 || inProgressMaintenanceCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpsOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpsOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reliability & Public State
                </div>

                <button
                  id="nav-subtab-status-page"
                  onClick={() => handleTabClick('status-page')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'status-page' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Public Status Page</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">Live</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">Public-facing uptime portal & incident updates</p>
                  </div>
                </button>

                <button
                  id="nav-subtab-ssl-radar"
                  onClick={() => handleTabClick('ssl-radar')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'ssl-radar' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">SSL & Domain Radar</span>
                      {expiringSslCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                          {expiringSslCount} expiring
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">Certificates, expiry dates & renewal warnings</p>
                  </div>
                </button>

                <button
                  id="nav-subtab-maintenance"
                  onClick={() => handleTabClick('maintenance')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'maintenance' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Maintenance Windows</span>
                      {inProgressMaintenanceCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono font-bold animate-pulse">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">Scheduled maintenance & smart alert suppression</p>
                  </div>
                </button>

                <button
                  id="nav-subtab-sla-reports"
                  onClick={() => handleTabClick('sla-reports')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'sla-reports' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">SLA Reliability Reports</span>
                    <p className="text-[11px] text-slate-400 leading-snug">Monthly 99.9% compliance & downtime budgets</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 3. Support Desk */}
          <button
            id="nav-tab-support-desk"
            onClick={() => handleTabClick('support-desk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'support-desk'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-teal-400" />
            <span>Support Desk</span>
            {openTicketsTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                urgentTicketsTotal > 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 text-blue-300 border border-slate-700'
              }`}>
                {openTicketsTotal}
              </span>
            )}
          </button>

          {/* 4. Alert Channels */}
          <button
            id="nav-tab-alert-channels"
            onClick={() => handleTabClick('alert-channels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'alert-channels'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alert Channels</span>
          </button>

          {/* 5. Tools & Deliverables Dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              id="nav-dropdown-tools"
              onClick={() => {
                setIsToolsOpen(!isToolsOpen);
                setIsOpsOpen(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isToolsActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tools & Source</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isToolsOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Client & Developer Tools
                </div>

                <button
                  id="nav-subtab-portal"
                  onClick={() => handleTabClick('public-portal')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'public-portal' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">Client Support Portal</span>
                    <p className="text-[11px] text-slate-400 leading-snug">Public ticketing & self-service inquiry view</p>
                  </div>
                </button>

                <button
                  id="nav-subtab-widget"
                  onClick={() => handleTabClick('widget-studio')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'widget-studio' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">Widget Studio</span>
                    <p className="text-[11px] text-slate-400 leading-snug">Embeddable status badges (HTML, React, SVG)</p>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-800/80"></div>

                <button
                  id="nav-subtab-code"
                  onClick={() => handleTabClick('code-explorer')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'code-explorer' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">Source Code & SQL</span>
                    <p className="text-[11px] text-slate-400 leading-snug">Python Flask, PostgreSQL schema.sql & seed.sql</p>
                  </div>
                </button>

                <button
                  id="nav-subtab-setup"
                  onClick={() => handleTabClick('setup-guide')}
                  className={`w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors ${
                    activeTab === 'setup-guide' ? 'bg-blue-600/15 text-blue-300' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">Setup & Deploy Guide</span>
                    <p className="text-[11px] text-slate-400 leading-snug">PostgreSQL, Python venv & background scheduler guide</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Health Status Indicator & Quick Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Health Pill Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isHealthy
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
            }`}
            title={`${totalSites - downSitesCount}/${totalSites} monitored targets currently operational`}
          >
            {isHealthy ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All Operational</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>{downSitesCount} Outage{downSitesCount > 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Direct Public Status Page Link */}
          <button
            id="nav-btn-status-page-quick"
            onClick={() => handleTabClick('status-page')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              activeTab === 'status-page'
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
            }`}
            title="Open Public Status Page"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Status View</span>
          </button>

          {/* Add Website Quick Action */}
          <button
            id="nav-btn-add-website"
            onClick={onOpenAddSite}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all hover:shadow-blue-500/40 shrink-0"
            title="Add a new website or API target to monitor"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Site</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            id="nav-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Accordion Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Core Monitoring */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Core Dashboard</div>
            <button
              onClick={() => handleTabClick('monitoring')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'monitoring' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Monitoring Dashboard</span>
            </button>
            <button
              onClick={() => handleTabClick('support-desk')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                activeTab === 'support-desk' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-teal-400" />
                <span>Support Desk</span>
              </div>
              {openTicketsTotal > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-blue-300 border border-slate-700">
                  {openTicketsTotal}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('alert-channels')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'alert-channels' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Alert Channels (Slack/Discord/Telegram)</span>
            </button>
          </div>

          {/* Operations Section */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Operations & Reliability</div>
            <button
              onClick={() => handleTabClick('status-page')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'status-page' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Public Status Page</span>
            </button>
            <button
              onClick={() => handleTabClick('ssl-radar')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                activeTab === 'ssl-radar' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>SSL & Domain Radar</span>
              </div>
              {expiringSslCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {expiringSslCount} expiring
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('maintenance')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                activeTab === 'maintenance' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Maintenance Windows</span>
              </div>
              {inProgressMaintenanceCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-mono font-bold animate-pulse">
                  Active
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('sla-reports')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'sla-reports' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>SLA Reliability Reports</span>
            </button>
          </div>

          {/* Tools & Docs */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">Tools & Code</div>
            <button
              onClick={() => handleTabClick('public-portal')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'public-portal' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Client Support Portal Preview</span>
            </button>
            <button
              onClick={() => handleTabClick('widget-studio')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'widget-studio' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Widget Generator Studio</span>
            </button>
            <button
              onClick={() => handleTabClick('code-explorer')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'code-explorer' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>Source Code & SQL Deliverables</span>
            </button>
            <button
              onClick={() => handleTabClick('setup-guide')}
              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                activeTab === 'setup-guide' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>SETUP.md Documentation</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
