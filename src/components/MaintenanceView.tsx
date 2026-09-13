import React, { useState } from 'react';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  Play, 
  Square, 
  ShieldAlert,
  Edit,
  Globe
} from 'lucide-react';
import { MaintenanceWindow, Website } from '../types';

interface MaintenanceViewProps {
  maintenanceWindows: MaintenanceWindow[];
  websites: Website[];
  onSaveMaintenance: (window: MaintenanceWindow) => void;
  onDeleteMaintenance: (id: string) => void;
  onUpdateStatus: (id: string, status: 'upcoming' | 'in_progress' | 'completed') => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenanceWindows,
  websites,
  onSaveMaintenance,
  onDeleteMaintenance,
  onUpdateStatus
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);

  const handleOpenAdd = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    setEditingWindow({
      id: `maint_${Date.now()}`,
      title: 'Database Engine Migration & Kernel Patching',
      description: 'Scheduled maintenance for PostgreSQL security updates and Linux kernel upgrade. Temporary connection resets may occur.',
      website_ids: [], // empty = all
      start_time: now.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
      suppress_alerts: true,
      status: 'upcoming',
      created_at: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MaintenanceWindow) => {
    setEditingWindow({ ...m });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWindow) return;
    onSaveMaintenance(editingWindow);
    setIsModalOpen(false);
    setEditingWindow(null);
  };

  const activeWindows = maintenanceWindows.filter(m => m.status === 'in_progress');
  const upcomingWindows = maintenanceWindows.filter(m => m.status === 'upcoming');
  const pastWindows = maintenanceWindows.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Scheduled Maintenance Windows</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Outage Silencing
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prevent false outage alarms and automatically inform clients on the Public Status Page during planned server upgrades.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* Active Maintenance Notice */}
      {activeWindows.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800/80 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <Wrench className="w-5 h-5 animate-spin" />
            <span>Active Maintenance Currently in Progress ({activeWindows.length})</span>
          </div>
          <p className="text-xs text-slate-300">
            Automated alerts are actively silenced for targeted endpoints. Visitors to the public status page will see planned maintenance announcements instead of system failure alerts.
          </p>
        </div>
      )}

      {/* Main Grid: Active & Upcoming */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
          Planned & Active Maintenance Windows
        </h2>

        {maintenanceWindows.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="font-bold text-white text-sm">No Maintenance Windows Scheduled</div>
            <p className="text-slate-400 max-w-sm mx-auto">
              Schedule planned maintenance before server updates to suppress false-positive alerts across Slack, Discord, and Email.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceWindows.map(window => {
              const isActive = window.status === 'in_progress';
              const isCompleted = window.status === 'completed';
              const targetNames = window.website_ids.length === 0 
                ? 'All Monitored Services' 
                : websites.filter(w => window.website_ids.includes(w.id)).map(w => w.name).join(', ');

              return (
                <div
                  key={window.id}
                  className={`p-5 rounded-2xl border transition-all bg-slate-900 ${
                    isActive 
                      ? 'border-amber-700/80 bg-amber-950/15 shadow-lg' 
                      : isCompleted 
                        ? 'border-slate-800/50 opacity-60' 
                        : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{window.title}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isCompleted
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {window.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(window)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMaintenance(window.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Window Details */}
                  <div className="mt-4 p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Target Services:</span>
                      <span className="font-bold text-slate-200 truncate max-w-[200px]">{targetNames}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Starts:</span>
                      <span className="font-mono text-slate-300">{new Date(window.start_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Ends:</span>
                      <span className="font-mono text-slate-300">{new Date(window.end_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                      <span className="text-slate-400">Alert Silencing:</span>
                      <span className="text-emerald-400 font-bold">
                        {window.suppress_alerts ? 'Enabled (No Alerts)' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* State Action Toolbar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                    {window.status === 'upcoming' && (
                      <button
                        onClick={() => onUpdateStatus(window.id, 'in_progress')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3" />
                        <span>Start Maintenance Now</span>
                      </button>
                    )}
                    {window.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateStatus(window.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark as Completed</span>
                      </button>
                    )}
                    {window.status === 'completed' && (
                      <button
                        onClick={() => onUpdateStatus(window.id, 'in_progress')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                      >
                        Reopen Window
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Create Maintenance Modal */}
      {isModalOpen && editingWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Schedule Planned Maintenance</h3>
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
                  Maintenance Title
                </label>
                <input
                  type="text"
                  required
                  value={editingWindow.title}
                  onChange={(e) => setEditingWindow({ ...editingWindow, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Public Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingWindow.description}
                  onChange={(e) => setEditingWindow({ ...editingWindow, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingWindow.start_time}
                    onChange={(e) => setEditingWindow({ ...editingWindow, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editingWindow.end_time}
                    onChange={(e) => setEditingWindow({ ...editingWindow, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Affected Target Services
                </label>
                <select
                  multiple
                  value={editingWindow.website_ids.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => Number(option.value));
                    setEditingWindow({ ...editingWindow, website_ids: selected });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white h-24 focus:outline-none focus:border-amber-500"
                >
                  {websites.map(site => (
                    <option key={site.id} value={site.id}>{site.name} ({site.url})</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Hold Ctrl/Cmd to select multiple. If none selected, applies to all monitored services.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="suppressAlerts"
                  checked={editingWindow.suppress_alerts}
                  onChange={(e) => setEditingWindow({ ...editingWindow, suppress_alerts: e.target.checked })}
                  className="rounded border-slate-800 text-amber-500 focus:ring-0"
                />
                <label htmlFor="suppressAlerts" className="text-xs text-slate-300">
                  Automatically silence failure notifications & incident tickets during this window
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Save Maintenance Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
