import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit, 
  Terminal, 
  Clock, 
  Check, 
  RefreshCw,
  MessageSquare,
  Radio,
  Sliders,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { AlertChannelConfig, AlertChannelType, DispatchedAlertLog, Website } from '../types';

interface AlertChannelsViewProps {
  channels: AlertChannelConfig[];
  dispatchLogs: DispatchedAlertLog[];
  websites: Website[];
  onSaveChannel: (channel: AlertChannelConfig) => void;
  onDeleteChannel: (channelId: string) => void;
  onToggleChannel: (channelId: string) => void;
  onTestDispatch: (channelId: string, websiteId?: number) => void;
}

export const AlertChannelsView: React.FC<AlertChannelsViewProps> = ({
  channels,
  dispatchLogs,
  websites,
  onSaveChannel,
  onDeleteChannel,
  onToggleChannel,
  onTestDispatch
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'logs' | 'docs'>('channels');
  const [editingChannel, setEditingChannel] = useState<AlertChannelConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  const [selectedSiteForTest, setSelectedSiteForTest] = useState<number>(websites[0]?.id || 1);

  const handleOpenAdd = (type: AlertChannelType = 'slack') => {
    setEditingChannel({
      id: `chan_${Date.now()}`,
      type,
      name: type === 'slack' ? 'DevOps Slack Channel' : type === 'discord' ? 'Incident Discord Server' : type === 'telegram' ? 'On-Call Telegram Bot' : 'Custom Ops Webhook',
      enabled: true,
      webhook_url: type === 'slack' ? 'https://hooks.slack.com/services/T00/B00/XXXX' : type === 'discord' ? 'https://discord.com/api/webhooks/000/XXXX' : 'https://api.mycompany.com/webhooks/incidents',
      telegram_bot_token: type === 'telegram' ? '123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ' : undefined,
      telegram_chat_id: type === 'telegram' ? '-1001234567890' : undefined,
      custom_headers: '{\n  "Authorization": "Bearer ops-token-secret-123"\n}',
      events: ['down', 'up', 'ssl_expiring', 'maintenance']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (channel: AlertChannelConfig) => {
    setEditingChannel({ ...channel });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    onSaveChannel(editingChannel);
    setIsModalOpen(false);
    setEditingChannel(null);
  };

  const handleRunTest = (channelId: string) => {
    onTestDispatch(channelId, selectedSiteForTest);
    setTestSuccessMessage(`Test notification dispatched! Check the Dispatched Logs tab to view payload.`);
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  const getChannelIcon = (type: AlertChannelType) => {
    switch (type) {
      case 'slack':
        return <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">#slack</div>;
      case 'discord':
        return <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">🎮</div>;
      case 'telegram':
        return <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">✈️</div>;
      case 'webhook':
        return <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono">&lt;/&gt;</div>;
      case 'email':
      default:
        return <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">✉️</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Multi-Channel Alert Dispatcher</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Webhooks & Integrations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch instant outage alerts, recovery notifications, and SSL expiration warnings to Slack, Discord, Telegram, and custom REST webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAdd('slack')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Slack</span>
          </button>
          <button
            onClick={() => handleOpenAdd('discord')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discord</span>
          </button>
          <button
            onClick={() => handleOpenAdd('telegram')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Telegram</span>
          </button>
          <button
            onClick={() => handleOpenAdd('webhook')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Webhook</span>
          </button>
        </div>
      </div>

      {testSuccessMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testSuccessMessage}</span>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('channels')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'channels'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Configured Channels ({channels.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'logs'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dispatched Alert Logs ({dispatchLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'docs'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Payload Schemas & Docs</span>
          </button>
        </div>

        {/* Target website selection for testing */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400">Test Context:</span>
          <select
            value={selectedSiteForTest}
            onChange={(e) => setSelectedSiteForTest(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
          >
            {websites.map(w => (
              <option key={w.id} value={w.id}>{w.name} ({w.url})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Content: Configured Channels */}
      {activeSubTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(channel => (
            <div
              key={channel.id}
              className={`p-5 rounded-2xl border transition-all bg-slate-900 ${
                channel.enabled ? 'border-slate-800 shadow-md' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {getChannelIcon(channel.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{channel.name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        channel.enabled 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {channel.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      Type: {channel.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleChannel(channel.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      channel.enabled 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                        : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                    }`}
                  >
                    {channel.enabled ? 'Pause' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(channel)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Edit Channel"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteChannel(channel.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Endpoint Preview */}
              <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                {channel.webhook_url && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Webhook URL:</span>
                    <span className="font-mono text-slate-300 truncate block text-[11px]">
                      {channel.webhook_url}
                    </span>
                  </div>
                )}
                {channel.telegram_chat_id && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Telegram Chat ID:</span>
                    <span className="font-mono text-sky-300 text-[11px]">{channel.telegram_chat_id}</span>
                  </div>
                )}
                <div className="pt-1 flex items-center justify-between border-t border-slate-900 text-[11px]">
                  <span className="text-slate-400">Events:</span>
                  <div className="flex gap-1">
                    {channel.events.map(ev => (
                      <span key={ev} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {channel.last_dispatched_at ? `Last sent: ${new Date(channel.last_dispatched_at).toLocaleTimeString()}` : 'Never dispatched'}
                </span>

                <button
                  onClick={() => handleRunTest(channel.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Alert</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Dispatched Alert Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Outbound Webhook Delivery Audit Log</h3>
            <span className="text-xs text-slate-400">{dispatchLogs.length} total events recorded</span>
          </div>

          {dispatchLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No alert notifications dispatched yet. Click "Send Test Alert" on any channel to test the notification pipeline.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {dispatchLogs.map(log => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.channel_name}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {log.channel_type}
                        </span>
                        <span className="font-semibold text-rose-400">[{log.event.toUpperCase()}]</span>
                        <span className="text-slate-300 font-medium">&bull; {log.website_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {log.payload_summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-bold uppercase">
                      {log.status}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Docs & Schemas */}
      {activeSubTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">#</span> Slack Webhook Block Kit Format
            </h3>
            <p className="text-xs text-slate-300">
              ChrisTech formats Slack alerts with interactive Block Kit cards including outage severity badges, latency numbers, and direct triage links.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-purple-300 overflow-x-auto">
              <pre>{`{
  "text": "CRITICAL: Acme Store is DOWN",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🚨 ChrisTech Alert: Acme Store DOWN" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Error:* 502 Bad Gateway" },
        { "type": "mrkdwn", "text": "*Latency:* 2140ms" }
      ]
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400">🎮</span> Discord Webhook Embed Payload
            </h3>
            <p className="text-xs text-slate-300">
              Discord channels receive rich color-coded embeds with red sidebar accents on outages and green accents on automatic service restorations.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-indigo-300 overflow-x-auto">
              <pre>{`{
  "username": "ChrisTech Sentinel",
  "embeds": [{
    "title": "🔴 Outage Detected: Acme Store",
    "color": 15158332,
    "fields": [
      { "name": "Status", "value": "HTTP 502", "inline": true },
      { "name": "Layer", "value": "Reverse Proxy", "inline": true }
    ],
    "timestamp": "2026-09-13T07:00:00.000Z"
  }]
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Channel Modal */}
      {isModalOpen && editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getChannelIcon(editingChannel.type)}
                <h3 className="font-bold text-white text-base">
                  Configure {editingChannel.type.toUpperCase()} Integration
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Channel / Integration Name
                </label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {editingChannel.type !== 'telegram' ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Webhook Destination URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editingChannel.webhook_url || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, webhook_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Telegram Bot API Token
                    </label>
                    <input
                      type="text"
                      required
                      value={editingChannel.telegram_bot_token || ''}
                      onChange={(e) => setEditingChannel({ ...editingChannel, telegram_bot_token: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Telegram Chat ID or Group ID
                    </label>
                    <input
                      type="text"
                      required
                      value={editingChannel.telegram_chat_id || ''}
                      onChange={(e) => setEditingChannel({ ...editingChannel, telegram_chat_id: e.target.value })}
                      placeholder="-100123456789"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {editingChannel.type === 'webhook' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Custom HTTP Headers (JSON)
                  </label>
                  <textarea
                    rows={3}
                    value={editingChannel.custom_headers || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, custom_headers: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Save Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
