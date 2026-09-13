/**
 * ChrisTech - Self-Hosted Website Monitoring & Unified Support Desk
 * Full Architecture & Interactive Management Suite
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Layers, 
  BookOpen, 
  Mail, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Github,
  Plus,
  Headphones,
  Sparkles,
  ShieldAlert,
  Code2,
  Radio,
  FileText,
  Wrench,
  ShieldCheck,
  BarChart3,
  Calendar,
  Bell
} from 'lucide-react';
import { 
  Website, 
  CheckLog, 
  TabType, 
  SupportTicket, 
  TicketStatus, 
  TicketPriority, 
  TicketCategory,
  AlertChannelConfig,
  DispatchedAlertLog,
  MaintenanceWindow 
} from './types';
import { DashboardView } from './components/DashboardView';
import { AddWebsiteModal } from './components/AddWebsiteModal';
import { SiteDetailModal } from './components/SiteDetailModal';
import { AlertPreviewModal } from './components/AlertPreviewModal';
import { ErrorDiagnosticsModal } from './components/ErrorDiagnosticsModal';
import { CodeExplorer } from './components/CodeExplorer';
import { SetupGuideView } from './components/SetupGuideView';
import { SupportDeskView } from './components/SupportDeskView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { PublicPortalView } from './components/PublicPortalView';
import { WidgetStudioView } from './components/WidgetStudioView';
import { StatusPageView } from './components/StatusPageView';
import { AlertChannelsView } from './components/AlertChannelsView';
import { SslDomainRadarView } from './components/SslDomainRadarView';
import { MaintenanceView } from './components/MaintenanceView';
import { SlaReportsView } from './components/SlaReportsView';
import { SystemNavbar } from './components/SystemNavbar';
import { diagnoseWebsiteError } from './utils/errorDiagnostics';

// Initial sample websites with SSL & Domain radar metrics
const INITIAL_WEBSITES: Website[] = [
  {
    id: 1,
    name: 'Google Production',
    url: 'https://www.google.com',
    check_interval_minutes: 1,
    keyword: 'Google',
    is_active: true,
    created_at: '2026-09-01 10:00:00',
    ssl_issuer: 'Google Trust Services LLC (GTS CA 1C3)',
    ssl_expiry_days: 64,
    ssl_expiry_date: '2026-11-16',
    domain_expiry_days: 720,
    domain_expiry_date: '2028-09-15',
    domain_registrar: 'MarkMonitor Inc.',
    logs: [
      { id: 101, website_id: 1, is_up: true, status_code: 200, response_time_ms: 62, error_message: null, checked_at: '2026-09-11 11:14:00' },
      { id: 102, website_id: 1, is_up: true, status_code: 200, response_time_ms: 78, error_message: null, checked_at: '2026-09-11 11:13:00' },
      { id: 103, website_id: 1, is_up: true, status_code: 200, response_time_ms: 71, error_message: null, checked_at: '2026-09-11 11:12:00' },
      { id: 104, website_id: 1, is_up: true, status_code: 200, response_time_ms: 65, error_message: null, checked_at: '2026-09-11 11:11:00' },
      { id: 105, website_id: 1, is_up: true, status_code: 200, response_time_ms: 69, error_message: null, checked_at: '2026-09-11 11:10:00' },
    ]
  },
  {
    id: 2,
    name: 'GitHub API Service',
    url: 'https://api.github.com',
    check_interval_minutes: 5,
    keyword: null,
    is_active: true,
    created_at: '2026-09-02 14:30:00',
    ssl_issuer: 'DigiCert High Assurance TLS Hybrid ECC SHA256 2020 CA1',
    ssl_expiry_days: 28,
    ssl_expiry_date: '2026-10-11',
    domain_expiry_days: 140,
    domain_expiry_date: '2027-01-31',
    domain_registrar: 'DNStination Inc.',
    logs: [
      { id: 201, website_id: 2, is_up: true, status_code: 200, response_time_ms: 135, error_message: null, checked_at: '2026-09-11 11:10:00' },
      { id: 202, website_id: 2, is_up: true, status_code: 200, response_time_ms: 142, error_message: null, checked_at: '2026-09-11 11:05:00' },
      { id: 203, website_id: 2, is_up: true, status_code: 200, response_time_ms: 129, error_message: null, checked_at: '2026-09-11 11:00:00' },
    ]
  },
  {
    id: 3,
    name: 'Legacy Microservice (Outage)',
    url: 'https://httpbin.org/status/503',
    check_interval_minutes: 2,
    keyword: null,
    is_active: true,
    created_at: '2026-09-05 09:15:00',
    ssl_issuer: "Let's Encrypt Authority X3",
    ssl_expiry_days: 5,
    ssl_expiry_date: '2026-09-18',
    domain_expiry_days: 12,
    domain_expiry_date: '2026-09-25',
    domain_registrar: 'Namecheap Inc.',
    logs: [
      { id: 301, website_id: 3, is_up: false, status_code: 503, response_time_ms: 840, error_message: 'HTTP 503: Service Unavailable. Downstream backend timeout.', checked_at: '2026-09-11 11:12:30' },
      { id: 302, website_id: 3, is_up: false, status_code: 503, response_time_ms: 790, error_message: 'HTTP 503: Service Unavailable', checked_at: '2026-09-11 11:10:30' },
      { id: 303, website_id: 3, is_up: true, status_code: 200, response_time_ms: 220, error_message: null, checked_at: '2026-09-11 11:08:30' },
    ]
  },
  {
    id: 4,
    name: 'Example Domain (Keyword Failure)',
    url: 'https://example.com',
    check_interval_minutes: 5,
    keyword: 'MissingKeywordXYZ',
    is_active: true,
    created_at: '2026-09-08 12:00:00',
    ssl_issuer: 'DigiCert Global Root G2',
    ssl_expiry_days: 94,
    ssl_expiry_date: '2026-12-16',
    domain_expiry_days: 340,
    domain_expiry_date: '2027-08-14',
    domain_registrar: 'IANA / ICANN',
    logs: [
      { id: 401, website_id: 4, is_up: false, status_code: 200, response_time_ms: 110, error_message: "Keyword 'MissingKeywordXYZ' was not found in response HTML.", checked_at: '2026-09-11 11:05:00' },
      { id: 402, website_id: 4, is_up: false, status_code: 200, response_time_ms: 104, error_message: "Keyword 'MissingKeywordXYZ' was not found in response HTML.", checked_at: '2026-09-11 11:00:00' },
    ]
  }
];

// Initial Multi-Channel Alert Configurations
const INITIAL_CHANNELS: AlertChannelConfig[] = [
  {
    id: 'chan-1',
    type: 'slack',
    name: 'DevOps Primary Slack (#incidents)',
    enabled: true,
    webhook_url: 'https://hooks.slack.com/services/T04XX/B08YY/devops-alerts',
    events: ['down', 'up', 'ssl_expiring', 'maintenance'],
    last_dispatched_at: '2026-09-11 11:12:30'
  },
  {
    id: 'chan-2',
    type: 'discord',
    name: 'Engineering Discord (#outage-war-room)',
    enabled: true,
    webhook_url: 'https://discord.com/api/webhooks/1122334455/christech-sentinel',
    events: ['down', 'up'],
    last_dispatched_at: '2026-09-11 11:12:30'
  },
  {
    id: 'chan-3',
    type: 'telegram',
    name: 'Lead SRE Mobile On-Call Bot',
    enabled: true,
    telegram_bot_token: '682910394:AAHq_7xK-SentinelOpsKey',
    telegram_chat_id: '-100849201948',
    events: ['down', 'up', 'ssl_expiring', 'maintenance']
  },
  {
    id: 'chan-4',
    type: 'webhook',
    name: 'Enterprise PagerDuty & Datadog Relay',
    enabled: true,
    webhook_url: 'https://events.pagerduty.com/v2/enqueue',
    custom_headers: '{\n  "Authorization": "Token token=pd_live_948201a"\n}',
    events: ['down', 'up']
  }
];

// Initial Scheduled Maintenance Windows
const INITIAL_MAINTENANCE: MaintenanceWindow[] = [
  {
    id: 'maint-1',
    title: 'PostgreSQL 16 Engine Patch & Replica Failover',
    description: 'Scheduled rolling maintenance on production database instances. Synthetic probes may record brief connection delays.',
    website_ids: [1, 2],
    start_time: '2026-09-14T02:00',
    end_time: '2026-09-14T04:00',
    suppress_alerts: true,
    status: 'upcoming',
    created_at: '2026-09-12 14:00:00'
  }
];

// Initial Dispatched Alert Logs
const INITIAL_DISPATCH_LOGS: DispatchedAlertLog[] = [
  {
    id: 'disp-1',
    channel_type: 'slack',
    channel_name: 'DevOps Primary Slack (#incidents)',
    event: 'down',
    website_name: 'Legacy Microservice (Outage)',
    status: 'delivered',
    timestamp: '2026-09-11 11:12:30',
    payload_summary: 'Sent Slack Block Kit card: HTTP 503 Service Unavailable (840ms)'
  },
  {
    id: 'disp-2',
    channel_type: 'discord',
    channel_name: 'Engineering Discord (#outage-war-room)',
    event: 'down',
    website_name: 'Legacy Microservice (Outage)',
    status: 'delivered',
    timestamp: '2026-09-11 11:12:30',
    payload_summary: 'Dispatched Discord Red Outage Embed with triage link'
  }
];

// Initial sample support tickets
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 1,
    ticket_number: 'CT-90421',
    website_id: 3, // Legacy Microservice (Outage)
    subject: 'CRITICAL OUTAGE: Legacy Microservice is DOWN (HTTP 503)',
    description: 'Automated Incident Triggered by ChrisTech Sentinel.\n\nHealth Check Failure Log:\n- Target Endpoint: https://httpbin.org/status/503\n- HTTP Status: 503 Service Unavailable\n- Response Latency: 840ms\n- Root Cause: Service Unavailable. Downstream backend timeout.',
    requester_name: 'ChrisTech Automated Sentinel',
    requester_email: 'monitoring@christech.local',
    category: 'outage',
    priority: 'urgent',
    status: 'open',
    is_automated_incident: true,
    created_at: '2026-09-11 11:12:30',
    updated_at: '2026-09-11 11:13:00',
    replies: [
      {
        id: 1,
        ticket_id: 1,
        author_name: 'DevOps On-Call',
        author_email: 'devops@example.com',
        is_staff: true,
        is_internal_note: true,
        message: 'Investigating microservice worker pods in cluster us-east-1. Gateway is throwing 503 due to upstream pool exhaustion.',
        created_at: '2026-09-11 11:13:00'
      }
    ]
  },
  {
    id: 2,
    ticket_number: 'CT-84192',
    website_id: 1, // Google Production
    subject: 'Search autocomplete widget latency in Safari',
    description: 'Clients on macOS Safari 17 reported that typing into the search input takes over 600ms to fetch suggestions.',
    requester_name: 'Sarah Chen (Lead Frontend)',
    requester_email: 'sarah.chen@clientbrand.com',
    category: 'bug',
    priority: 'high',
    status: 'in_progress',
    is_automated_incident: false,
    created_at: '2026-09-10 16:20:00',
    updated_at: '2026-09-11 09:40:00',
    replies: [
      {
        id: 2,
        ticket_id: 2,
        author_name: 'Sarah Chen',
        author_email: 'sarah.chen@clientbrand.com',
        is_staff: false,
        is_internal_note: false,
        message: 'Reproduced on Safari 17.4.2 desktop. Firefox and Chrome perform normally.',
        created_at: '2026-09-10 16:25:00'
      },
      {
        id: 3,
        ticket_id: 2,
        author_name: 'Chris (Support Desk)',
        author_email: 'support@christech.local',
        is_staff: true,
        is_internal_note: false,
        message: 'Thanks Sarah! We have profiled the debounce handler on Safari WebKit and identified an unneeded reflow. Patching in the staging build now.',
        created_at: '2026-09-11 09:40:00'
      }
    ]
  },
  {
    id: 3,
    ticket_number: 'CT-76231',
    website_id: 4, // Example Domain (Keyword Failure)
    subject: 'Keyword Verification Alert: MissingKeywordXYZ missing',
    description: 'Automated Incident: Expected keyword "MissingKeywordXYZ" was not found in response HTML despite HTTP 200 status code. The page may have returned an unexpected blank body or error layout.',
    requester_name: 'ChrisTech Automated Sentinel',
    requester_email: 'monitoring@christech.local',
    category: 'outage',
    priority: 'high',
    status: 'open',
    is_automated_incident: true,
    created_at: '2026-09-11 11:05:00',
    updated_at: '2026-09-11 11:05:00',
    replies: []
  },
  {
    id: 4,
    ticket_number: 'CT-62114',
    website_id: 2, // GitHub API Service
    subject: 'Inquiry regarding webhook payload schema',
    description: 'We want to connect our continuous integration build notifications directly into our Slack channel using your webhook dispatcher. Where can we find the event payload JSON schema?',
    requester_name: 'David Miller',
    requester_email: 'dmiller@techcorp.io',
    category: 'general',
    priority: 'low',
    status: 'resolved',
    is_automated_incident: false,
    created_at: '2026-09-08 14:10:00',
    updated_at: '2026-09-09 10:15:00',
    replies: [
      {
        id: 4,
        ticket_id: 4,
        author_name: 'Chris (Support Desk)',
        author_email: 'support@christech.local',
        is_staff: true,
        is_internal_note: false,
        message: 'Hi David, you can inspect the full JSON webhook schema in the SETUP.md guide or at the /api/support/submit endpoint documentation.',
        created_at: '2026-09-09 10:15:00'
      }
    ]
  }
];

export default function App() {
  const [websites, setWebsites] = useState<Website[]>(() => {
    const saved = localStorage.getItem('christech_websites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_WEBSITES;
      }
    }
    return INITIAL_WEBSITES;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('christech_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TICKETS;
      }
    }
    return INITIAL_TICKETS;
  });

  const [activeTab, setActiveTab] = useState<TabType>('monitoring');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailWebsite, setDetailWebsite] = useState<Website | null>(null);
  const [alertWebsite, setAlertWebsite] = useState<Website | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Support desk modals
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [preselectedSiteIdForTicket, setPreselectedSiteIdForTicket] = useState<number | undefined>(undefined);
  const [diagnosticsWebsite, setDiagnosticsWebsite] = useState<Website | null>(null);

  // Multi-Channel Alert State
  const [channels, setChannels] = useState<AlertChannelConfig[]>(() => {
    const saved = localStorage.getItem('christech_channels');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_CHANNELS; }
    }
    return INITIAL_CHANNELS;
  });

  const [dispatchLogs, setDispatchLogs] = useState<DispatchedAlertLog[]>(() => {
    const saved = localStorage.getItem('christech_dispatch_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_DISPATCH_LOGS; }
    }
    return INITIAL_DISPATCH_LOGS;
  });

  // Scheduled Maintenance Windows
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>(() => {
    const saved = localStorage.getItem('christech_maintenance');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_MAINTENANCE; }
    }
    return INITIAL_MAINTENANCE;
  });

  useEffect(() => {
    localStorage.setItem('christech_websites', JSON.stringify(websites));
  }, [websites]);

  useEffect(() => {
    localStorage.setItem('christech_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('christech_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('christech_dispatch_logs', JSON.stringify(dispatchLogs));
  }, [dispatchLogs]);

  useEffect(() => {
    localStorage.setItem('christech_maintenance', JSON.stringify(maintenanceWindows));
  }, [maintenanceWindows]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dispatch alert to all active integrated channels (Slack, Discord, Telegram, Webhook)
  const dispatchToChannels = (
    site: Website,
    event: 'down' | 'up' | 'ssl_expiring' | 'maintenance',
    summary: string
  ) => {
    const activeChannels = channels.filter(c => c.enabled && c.events.includes(event));
    if (activeChannels.length === 0) return;

    const now = new Date().toISOString();
    const newLogs: DispatchedAlertLog[] = activeChannels.map(chan => ({
      id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      channel_type: chan.type,
      channel_name: chan.name,
      event,
      website_name: site.name,
      status: 'delivered',
      timestamp: now,
      payload_summary: `${chan.type.toUpperCase()} Notification: ${summary}`
    }));

    setDispatchLogs(prev => [...newLogs, ...prev]);
    setChannels(prev => prev.map(c => 
      activeChannels.some(ac => ac.id === c.id) ? { ...c, last_dispatched_at: now } : c
    ));
  };

  // Alert Channel Handlers
  const handleSaveChannel = (channel: AlertChannelConfig) => {
    setChannels(prev => {
      const exists = prev.some(c => c.id === channel.id);
      if (exists) {
        return prev.map(c => c.id === channel.id ? channel : c);
      }
      return [channel, ...prev];
    });
    showToast(`Alert Channel '${channel.name}' saved.`);
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId));
    showToast('Alert integration deleted.');
  };

  const handleToggleChannel = (channelId: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, enabled: !c.enabled } : c));
  };

  const handleTestDispatch = (channelId: string, websiteId?: number) => {
    const channel = channels.find(c => c.id === channelId);
    const targetSite = websites.find(w => w.id === websiteId) || websites[0];
    if (!channel || !targetSite) return;

    const now = new Date().toISOString();
    const testLog: DispatchedAlertLog = {
      id: `disp_test_${Date.now()}`,
      channel_type: channel.type,
      channel_name: channel.name,
      event: 'down',
      website_name: targetSite.name,
      status: 'simulated',
      timestamp: now,
      payload_summary: `[Test Dispatch] Formatted ${channel.type.toUpperCase()} payload with simulated HTTP 502 Bad Gateway alert.`
    };

    setDispatchLogs(prev => [testLog, ...prev]);
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, last_dispatched_at: now } : c));
    showToast(`Test payload dispatched to ${channel.name}!`);
  };

  // Maintenance Window Handlers
  const handleSaveMaintenance = (window: MaintenanceWindow) => {
    setMaintenanceWindows(prev => {
      const exists = prev.some(m => m.id === window.id);
      if (exists) {
        return prev.map(m => m.id === window.id ? window : m);
      }
      return [window, ...prev];
    });
    showToast(`Maintenance Window '${window.title}' scheduled.`);
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceWindows(prev => prev.filter(m => m.id !== id));
    showToast('Maintenance window cancelled.');
  };

  const handleUpdateMaintenanceStatus = (id: string, status: 'upcoming' | 'in_progress' | 'completed') => {
    setMaintenanceWindows(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    showToast(`Maintenance status updated to '${status}'.`);
  };

  const handleTriggerSslAlert = (site: Website) => {
    dispatchToChannels(site, 'ssl_expiring', `SSL Certificate for ${site.name} expires in ${site.ssl_expiry_days ?? 5} days.`);
    showToast(`Dispatched proactive SSL expiration warning for '${site.name}'.`);
  };

  // Add website handler
  const handleAddWebsite = (newSiteData: Omit<Website, 'id' | 'created_at' | 'logs'>) => {
    const newId = Date.now();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Simulate first check
    const simulatedLatency = Math.floor(Math.random() * 120) + 45;
    const isKeywordFail = Boolean(newSiteData.keyword && newSiteData.keyword.toLowerCase().includes('fail'));
    const isUp = !isKeywordFail;

    const initialLog: CheckLog = {
      id: Date.now() + 1,
      website_id: newId,
      is_up: isUp,
      status_code: isUp ? 200 : 200,
      response_time_ms: simulatedLatency,
      error_message: isUp ? null : `Keyword '${newSiteData.keyword}' was not found in response HTML.`,
      checked_at: nowStr
    };

    const newWebsite: Website = {
      ...newSiteData,
      id: newId,
      created_at: nowStr,
      logs: [initialLog]
    };

    setWebsites(prev => [newWebsite, ...prev]);
    showToast(`Website '${newWebsite.name}' registered into monitor.`);
  };

  // Check now handler (with automated support ticket trigger on outage!)
  const handleCheckNow = async (websiteId: number) => {
    const site = websites.find(w => w.id === websiteId);
    if (!site) return;

    showToast(`Running check for '${site.name}'...`);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 450));

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const simulatedLatency = Math.floor(Math.random() * 160) + 40;
    
    // Check keyword or outage condition
    let isUp = true;
    let statusCode: number | null = 200;
    let errorMsg: string | null = null;

    if (site.url.includes('503') || site.name.toLowerCase().includes('outage')) {
      isUp = false;
      statusCode = 503;
      errorMsg = 'HTTP 503: Service Unavailable';
    } else if (site.keyword && (site.keyword.includes('Missing') || site.keyword.includes('fail') || site.keyword.includes('XYZ'))) {
      isUp = false;
      statusCode = 200;
      errorMsg = `Keyword '${site.keyword}' was not found in response HTML.`;
    }

    const newLog: CheckLog = {
      id: Date.now(),
      website_id: site.id,
      is_up: isUp,
      status_code: statusCode,
      response_time_ms: simulatedLatency,
      error_message: errorMsg,
      checked_at: nowStr
    };

    setWebsites(prev => prev.map(w => {
      if (w.id === websiteId) {
        const updatedLogs = [newLog, ...w.logs.slice(0, 49)];
        const updated = { ...w, logs: updatedLogs };
        if (detailWebsite && detailWebsite.id === websiteId) {
          setDetailWebsite(updated);
        }
        if (diagnosticsWebsite && diagnosticsWebsite.id === websiteId) {
          setDiagnosticsWebsite(updated);
        }
        return updated;
      }
      return w;
    }));

    // Check if website is currently inside an active maintenance window with alert suppression
    const activeMaint = maintenanceWindows.find(m => 
      m.status === 'in_progress' && 
      m.suppress_alerts &&
      (m.website_ids.length === 0 || m.website_ids.includes(site.id))
    );

    if (activeMaint) {
      showToast(`🛠️ Maintenance In Progress: Outage alerts silenced for '${site.name}' (${activeMaint.title})`);
    } else if (!isUp) {
      // Diagnose error origin and remediation steps
      const diag = diagnoseWebsiteError(site, newLog);

      // Dispatch proactive alert to integrated channels (Slack, Discord, Telegram, Webhook)
      dispatchToChannels(
        site, 
        'down', 
        `CRITICAL OUTAGE: ${site.name} is DOWN (${diag?.layerTitle.split('(')[0] || errorMsg || 'HTTP Failure'}) - Latency: ${simulatedLatency}ms`
      );

      // Check if an open incident ticket already exists
      const existingIncident = tickets.find(
        t => t.website_id === site.id && t.is_automated_incident && t.status !== 'resolved' && t.status !== 'closed'
      );
      if (!existingIncident) {
        const newTicketNumber = `CT-${Math.floor(10000 + Math.random() * 90000)}`;
        
        const diagSection = diag ? `\n\n=== ROOT CAUSE & FIX GUIDE ===\n- Where error is coming from: ${diag.layerTitle} (${diag.sourceComponent})\n- Underlying Cause: ${diag.rootCause}\n\nRecommended Fix Steps:\n${diag.remediationSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\nServer Remediation Command:\n${diag.remediationCommands[0] || 'N/A'}` : '';

        const autoIncidentTicket: SupportTicket = {
          id: Date.now(),
          ticket_number: newTicketNumber,
          website_id: site.id,
          subject: `CRITICAL OUTAGE: ${site.name} is DOWN (${diag?.layerTitle.split('(')[0] || errorMsg || 'HTTP Failure'})`,
          description: `Automated incident triggered by ChrisTech Health Sentinel.\n\nDiagnostics:\n- Target: ${site.url}\n- Status Code: ${statusCode}\n- Latency: ${simulatedLatency}ms\n- Error: ${errorMsg}\n- Timestamp: ${nowStr}${diagSection}`,
          requester_name: 'ChrisTech Automated Sentinel',
          requester_email: 'monitoring@christech.local',
          category: 'outage',
          priority: 'urgent',
          status: 'open',
          is_automated_incident: true,
          created_at: nowStr,
          updated_at: nowStr,
          replies: []
        };
        setTickets(prev => [autoIncidentTicket, ...prev]);
        showToast(`🚨 OUTAGE DETECTED: Automated Incident #${newTicketNumber} opened & dispatched to channels!`);
      } else {
        showToast(`⚠️ Site '${site.name}' remains DOWN. Existing Incident #${existingIncident.ticket_number} updated.`);
      }
    } else {
      // If recovering from downtime, auto-resolve incident and notify channels
      const openIncident = tickets.find(
        t => t.website_id === site.id && t.is_automated_incident && t.status !== 'resolved' && t.status !== 'closed'
      );
      if (openIncident) {
        // Dispatch recovery alert to channels
        dispatchToChannels(
          site,
          'up',
          `RECOVERED: ${site.name} has passed synthetic probe checks (${simulatedLatency}ms, HTTP 200 OK). Incident #${openIncident.ticket_number} resolved.`
        );

        setTickets(prev => prev.map(t => {
          if (t.id === openIncident.id) {
            const recoveryReply = {
              id: Date.now(),
              ticket_id: t.id,
              author_name: 'ChrisTech Automated Sentinel',
              author_email: 'monitoring@christech.local',
              is_staff: true,
              is_internal_note: false,
              message: `System Recovery Notice: Endpoint has recovered and passed health check (${simulatedLatency}ms, HTTP 200 OK). Auto-resolving incident.`,
              created_at: nowStr
            };
            return {
              ...t,
              status: 'resolved',
              updated_at: nowStr,
              replies: [...t.replies, recoveryReply]
            };
          }
          return t;
        }));
        showToast(`✅ '${site.name}' RECOVERED: Incident #${openIncident.ticket_number} auto-resolved!`);
      } else {
        showToast(`Check finished: '${site.name}' is UP (${simulatedLatency}ms)`);
      }
    }
  };

  // Toggle active/paused
  const handleToggleActive = (websiteId: number) => {
    setWebsites(prev => prev.map(w => {
      if (w.id === websiteId) {
        const nextActive = !w.is_active;
        const updated = { ...w, is_active: nextActive };
        if (detailWebsite && detailWebsite.id === websiteId) {
          setDetailWebsite(updated);
        }
        showToast(`Website '${w.name}' monitoring is now ${nextActive ? 'active' : 'paused'}.`);
        return updated;
      }
      return w;
    }));
  };

  // Delete website
  const handleDeleteWebsite = (websiteId: number) => {
    setWebsites(prev => prev.filter(w => w.id !== websiteId));
    // Cascade delete tickets for that website
    setTickets(prev => prev.filter(t => t.website_id !== websiteId));
    if (detailWebsite && detailWebsite.id === websiteId) {
      setDetailWebsite(null);
    }
    showToast('Website, logs, and associated support tickets deleted.');
  };

  // Support ticket handlers
  const handleCreateTicket = (ticketData: {
    website_id: number;
    subject: string;
    description: string;
    requester_name: string;
    requester_email: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => {
    const newId = Date.now();
    const newNumber = `CT-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newTicket: SupportTicket = {
      id: newId,
      ticket_number: newNumber,
      website_id: ticketData.website_id,
      subject: ticketData.subject,
      description: ticketData.description,
      requester_name: ticketData.requester_name,
      requester_email: ticketData.requester_email,
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'open',
      is_automated_incident: false,
      created_at: nowStr,
      updated_at: nowStr,
      replies: []
    };

    setTickets(prev => [newTicket, ...prev]);
    showToast(`Support Ticket #${newNumber} created successfully!`);
  };

  const handleAddReply = (
    ticketId: number,
    message: string,
    isInternalNote: boolean,
    authorName: string,
    updateStatus?: TicketStatus
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newReply = {
      id: Date.now(),
      ticket_id: ticketId,
      author_name: authorName,
      author_email: 'support@christech.local',
      is_staff: true,
      is_internal_note: isInternalNote,
      message,
      created_at: nowStr
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = {
          ...t,
          status: updateStatus || t.status,
          updated_at: nowStr,
          replies: [...t.replies, newReply]
        };
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
        return updated;
      }
      return t;
    }));

    showToast(isInternalNote ? 'Internal staff note saved.' : 'Reply sent to customer!');
  };

  const handleUpdateTicketStatus = (ticketId: number, status: TicketStatus, priority?: TicketPriority) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = {
          ...t,
          status,
          priority: priority || t.priority,
          updated_at: nowStr
        };
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
        return updated;
      }
      return t;
    }));
    showToast(`Ticket #${ticketId} status changed to ${status}.`);
  };

  // Metrics for navbar badge
  const openTicketsTotal = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const urgentTicketsTotal = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;
  const inProgressMaintenanceCount = maintenanceWindows.filter(m => m.status === 'in_progress').length;
  const expiringSslCount = websites.filter(w => (w.ssl_expiry_days ?? 999) <= 30).length;

  // Dedicated full-page public status view
  if (activeTab === 'status-page') {
    return (
      <StatusPageView
        websites={websites}
        tickets={tickets}
        maintenanceWindows={maintenanceWindows}
        onBackToAdmin={() => setActiveTab('monitoring')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-blue-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Zap className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top System Navbar */}
      <SystemNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        websites={websites}
        tickets={tickets}
        maintenanceWindows={maintenanceWindows}
        onOpenAddSite={() => setIsAddModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'monitoring' && (
          <DashboardView
            websites={websites}
            tickets={tickets}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenDetailModal={(site) => setDetailWebsite(site)}
            onOpenAlertModal={(site) => setAlertWebsite(site)}
            onOpenDiagnosticsModal={(site) => setDiagnosticsWebsite(site)}
            onCheckNow={handleCheckNow}
            onDelete={handleDeleteWebsite}
            onGoToSupport={(siteId) => {
              setActiveTab('support-desk');
            }}
            onOpenCreateTicketForSite={(siteId) => {
              setPreselectedSiteIdForTicket(siteId);
              setIsCreateTicketOpen(true);
            }}
          />
        )}

        {activeTab === 'ssl-radar' && (
          <SslDomainRadarView
            websites={websites}
            onRefreshCert={handleCheckNow}
            onTriggerSslAlert={handleTriggerSslAlert}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            maintenanceWindows={maintenanceWindows}
            websites={websites}
            onSaveMaintenance={handleSaveMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
            onUpdateStatus={handleUpdateMaintenanceStatus}
          />
        )}

        {activeTab === 'alert-channels' && (
          <AlertChannelsView
            channels={channels}
            dispatchLogs={dispatchLogs}
            websites={websites}
            onSaveChannel={handleSaveChannel}
            onDeleteChannel={handleDeleteChannel}
            onToggleChannel={handleToggleChannel}
            onTestDispatch={handleTestDispatch}
          />
        )}

        {activeTab === 'sla-reports' && (
          <SlaReportsView
            websites={websites}
          />
        )}

        {activeTab === 'support-desk' && (
          <SupportDeskView
            websites={websites}
            tickets={tickets}
            onOpenCreateTicket={() => {
              setPreselectedSiteIdForTicket(undefined);
              setIsCreateTicketOpen(true);
            }}
            onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            onQuickUpdateStatus={(ticketId, status) => handleUpdateTicketStatus(ticketId, status)}
          />
        )}

        {activeTab === 'public-portal' && (
          <PublicPortalView
            websites={websites}
            onSubmitTicket={handleCreateTicket}
            onGoToSupportDesk={() => setActiveTab('support-desk')}
          />
        )}

        {activeTab === 'widget-studio' && (
          <WidgetStudioView websites={websites} />
        )}

        {activeTab === 'code-explorer' && (
          <CodeExplorer />
        )}

        {activeTab === 'setup-guide' && (
          <SetupGuideView />
        )}
      </main>

      {/* Modals */}
      <AddWebsiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddWebsite}
      />

      <SiteDetailModal
        website={detailWebsite}
        isOpen={detailWebsite !== null}
        onClose={() => setDetailWebsite(null)}
        onCheckNow={handleCheckNow}
        onToggleActive={handleToggleActive}
        onOpenDiagnosticsModal={(site) => setDiagnosticsWebsite(site)}
      />

      <AlertPreviewModal
        website={alertWebsite}
        isOpen={alertWebsite !== null}
        onClose={() => setAlertWebsite(null)}
      />

      {/* Error Root Cause & Remediation Diagnostics Modal */}
      <ErrorDiagnosticsModal
        website={diagnosticsWebsite}
        isOpen={diagnosticsWebsite !== null}
        onClose={() => setDiagnosticsWebsite(null)}
        onCheckNow={handleCheckNow}
        onCreateTicketFromDiagnosis={(siteId, subject, description) => {
          handleCreateTicket({
            website_id: siteId,
            subject,
            description,
            requester_name: 'ChrisTech Diagnostic Sentinel',
            requester_email: 'diagnostics@christech.local',
            category: 'outage',
            priority: 'urgent',
          });
          setDiagnosticsWebsite(null);
          setActiveTab('support-desk');
        }}
      />

      {/* Support Modals */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          website={websites.find(w => w.id === selectedTicket.website_id)}
          onClose={() => setSelectedTicket(null)}
          onAddReply={handleAddReply}
          onUpdateStatus={handleUpdateTicketStatus}
          onOpenDiagnosticsModal={(site) => setDiagnosticsWebsite(site)}
        />
      )}

      {isCreateTicketOpen && (
        <CreateTicketModal
          websites={websites}
          preselectedSiteId={preselectedSiteIdForTicket}
          onClose={() => {
            setIsCreateTicketOpen(false);
            setPreselectedSiteIdForTicket(undefined);
          }}
          onSubmit={handleCreateTicket}
        />
      )}

      {/* Global Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <div>ChrisTech &bull; Self-Hosted Website Monitoring & Support Desk for Monitored Sites</div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Flask + PostgreSQL + APScheduler + Support API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
