import React, { useState, useMemo } from 'react';
import { 
  Headphones, 
  Search, 
  Plus, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  ExternalLink,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Website, SupportTicket, TicketStatus, TicketPriority } from '../types';

interface SupportDeskViewProps {
  websites: Website[];
  tickets: SupportTicket[];
  onOpenCreateTicket: () => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  onQuickUpdateStatus: (ticketId: number, status: TicketStatus) => void;
}

export const SupportDeskView: React.FC<SupportDeskViewProps> = ({
  websites,
  tickets,
  onOpenCreateTicket,
  onSelectTicket,
  onQuickUpdateStatus,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (selectedSiteId !== 'all' && ticket.website_id !== selectedSiteId) return false;
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && ticket.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = ticket.subject.toLowerCase().includes(q);
        const matchesNumber = ticket.ticket_number.toLowerCase().includes(q);
        const matchesRequester = ticket.requester_name.toLowerCase().includes(q) || ticket.requester_email.toLowerCase().includes(q);
        const matchesDesc = ticket.description.toLowerCase().includes(q);
        if (!matchesSubject && !matchesNumber && !matchesRequester && !matchesDesc) return false;
      }
      return true;
    });
  }, [tickets, selectedSiteId, selectedStatus, selectedPriority, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, open, inProgress, urgent, resolved, resolutionRate };
  }, [tickets]);

  const getWebsite = (siteId: number) => websites.find(w => w.id === siteId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Headphones className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Centralized Support Helpdesk</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
              All Sites Unified
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Triaged customer issues, bug tickets, and automated outage alerts across all your monitored websites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateTicket}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Tickets</div>
          <div className="text-2xl font-bold text-white">{metrics.total}</div>
          <div className="text-xs text-slate-500 mt-1">Across {websites.length} websites</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">Active Queue</div>
          <div className="text-2xl font-bold text-blue-400">{metrics.open + metrics.inProgress}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.open} open, {metrics.inProgress} in progress</div>
        </div>

        <div className={`bg-slate-900 border rounded-xl p-4 ${metrics.urgent > 0 ? 'border-red-900/50 bg-red-950/20' : 'border-slate-800'}`}>
          <div className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">Urgent & Outages</div>
          <div className={`text-2xl font-bold ${metrics.urgent > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {metrics.urgent}
          </div>
          <div className="text-xs text-slate-500 mt-1">High-priority alerts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Resolution Rate</div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.resolutionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.resolved} resolved or closed</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, requester, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Website Selector */}
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Websites ({websites.length})</option>
              {websites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting on Client</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Selector */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(selectedSiteId !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedSiteId('all');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Website Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <span className="text-slate-500 text-xs shrink-0 font-medium">Filter by Site:</span>
          <button
            onClick={() => setSelectedSiteId('all')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
              selectedSiteId === 'all'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Sites ({tickets.length})
          </button>
          {websites.map(site => {
            const siteTicketsCount = tickets.filter(t => t.website_id === site.id).length;
            const openCount = tickets.filter(t => t.website_id === site.id && t.status !== 'resolved' && t.status !== 'closed').length;
            return (
              <button
                key={site.id}
                onClick={() => setSelectedSiteId(site.id)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedSiteId === site.id
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{site.name}</span>
                {openCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900/60 font-mono font-bold">
                    {openCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">Tickets Queue</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredTickets.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Click any row to inspect conversation thread</span>
        </div>

        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Ticket #</th>
                  <th className="px-6 py-3">Website</th>
                  <th className="px-6 py-3">Subject & Category</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Requester</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredTickets.map(ticket => {
                  const site = getWebsite(ticket.website_id);
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      {/* Ticket Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-400 text-xs flex items-center gap-1.5">
                          #{ticket.ticket_number}
                        </div>
                        {ticket.is_automated_incident && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-wider mt-0.5">
                            <ShieldAlert className="w-3 h-3" /> Auto Incident
                          </div>
                        )}
                      </td>

                      {/* Associated Website */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white text-sm">{site?.name || 'Unknown Site'}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{site?.url}</div>
                      </td>

                      {/* Subject & Category */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-100 line-clamp-1 max-w-sm">
                          {ticket.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                            {ticket.category}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.replies.length} replies
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.priority === 'urgent' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/60 text-red-400 border border-red-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Urgent
                          </span>
                        )}
                        {ticket.priority === 'high' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/50 text-orange-400 border border-orange-800/50">
                            High
                          </span>
                        )}
                        {ticket.priority === 'medium' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/50 text-blue-400 border border-blue-800/50">
                            Medium
                          </span>
                        )}
                        {ticket.priority === 'low' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                            Low
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.status === 'open' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/50">
                            Open
                          </span>
                        )}
                        {ticket.status === 'in_progress' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/50">
                            In Progress
                          </span>
                        )}
                        {ticket.status === 'waiting' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-700/50">
                            Waiting
                          </span>
                        )}
                        {ticket.status === 'resolved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
                            Resolved
                          </span>
                        )}
                        {ticket.status === 'closed' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Closed
                          </span>
                        )}
                      </td>

                      {/* Requester */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200 text-xs">{ticket.requester_name}</div>
                        <div className="text-slate-400 text-xs truncate max-w-[140px]">{ticket.requester_email}</div>
                      </td>

                      {/* Updated Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                        {ticket.updated_at.split(' ')[0]}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                            <button
                              onClick={() => onQuickUpdateStatus(ticket.id, 'resolved')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 rounded-md transition"
                              title="Mark ticket as resolved"
                            >
                              Resolve
                            </button>
                          ) : (
                            <button
                              onClick={() => onQuickUpdateStatus(ticket.id, 'open')}
                              className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition"
                              title="Reopen ticket"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => onSelectTicket(ticket)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-slate-800 hover:bg-slate-700 rounded-md transition"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Headphones className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white mb-1">No Tickets Found</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
              All clear! None of your monitored sites have pending tickets matching the selected filters.
            </p>
            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
            >
              + Create New Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
