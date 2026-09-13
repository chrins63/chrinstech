export interface CheckLog {
  id: number;
  website_id: number;
  is_up: boolean;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

export type ErrorOriginLayer = 
  | 'dns'
  | 'ssl_tls'
  | 'network_transport'
  | 'gateway_proxy'
  | 'application_server'
  | 'database_storage'
  | 'dom_content'
  | 'auth_waf'
  | 'client_routing'
  | 'timeout';

export interface ErrorDiagnosis {
  layer: ErrorOriginLayer;
  layerTitle: string;
  sourceComponent: string;
  rootCause: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  possibleReasons: string[];
  remediationSteps: string[];
  remediationCommands: string[];
  configFileSuggestions?: string[];
  preventionTips: string[];
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  author_name: string;
  author_email?: string | null;
  is_staff: boolean;
  is_internal_note: boolean;
  message: string;
  created_at: string;
}

export type TicketCategory = 'outage' | 'bug' | 'performance' | 'billing' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface SupportTicket {
  id: number;
  ticket_number: string;
  website_id: number;
  subject: string;
  description: string;
  requester_name: string;
  requester_email: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  is_automated_incident: boolean;
  created_at: string;
  updated_at: string;
  replies: TicketReply[];
}

export interface Website {
  id: number;
  name: string;
  url: string;
  check_interval_minutes: number;
  keyword: string | null;
  is_active: boolean;
  created_at: string;
  logs: CheckLog[];
  // SSL & Domain Radar fields
  ssl_issuer?: string;
  ssl_expiry_days?: number;
  ssl_expiry_date?: string;
  domain_expiry_days?: number;
  domain_expiry_date?: string;
  domain_registrar?: string;
}

export type TabType = 
  | 'monitoring' 
  | 'status-page'
  | 'ssl-radar'
  | 'maintenance'
  | 'alert-channels'
  | 'sla-reports'
  | 'support-desk' 
  | 'public-portal' 
  | 'widget-studio' 
  | 'code-explorer' 
  | 'setup-guide';

// Multi-Channel Alerting
export type AlertChannelType = 'slack' | 'discord' | 'telegram' | 'webhook' | 'email';

export interface AlertChannelConfig {
  id: string;
  type: AlertChannelType;
  name: string;
  enabled: boolean;
  webhook_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  custom_headers?: string;
  events: ('down' | 'up' | 'ssl_expiring' | 'maintenance')[];
  last_dispatched_at?: string;
}

export interface DispatchedAlertLog {
  id: string;
  channel_type: AlertChannelType;
  channel_name: string;
  event: string;
  website_name: string;
  status: 'delivered' | 'failed' | 'simulated';
  timestamp: string;
  payload_summary: string;
}

// Scheduled Maintenance Windows
export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  website_ids: number[]; // empty means all websites
  start_time: string;
  end_time: string;
  suppress_alerts: boolean;
  status: 'upcoming' | 'in_progress' | 'completed';
  created_at: string;
}

// SLA Report
export interface SlaReportData {
  website_id: number;
  period: string;
  target_sla_percentage: number;
  actual_uptime_percentage: number;
  sla_breached: boolean;
  total_checks: number;
  failed_checks: number;
  total_downtime_minutes: number;
  allowed_downtime_minutes: number;
  mttr_minutes: number;
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  p95_latency_ms: number;
  generated_at: string;
}

export interface CodeDeliverable {
  filename: string;
  language: string;
  category: 'Backend' | 'Logic' | 'Templates' | 'Config' | 'Documentation';
  description: string;
  content: string;
}
