import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  ShieldAlert, 
  Lock, 
  Send, 
  Globe, 
  Clock, 
  User, 
  Mail, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Wrench,
  Terminal,
  Layers
} from 'lucide-react';
import { SupportTicket, Website, TicketStatus, TicketPriority } from '../types';
import { diagnoseWebsiteError } from '../utils/errorDiagnostics';

interface TicketDetailModalProps {
  ticket: SupportTicket;
  website?: Website;
  onClose: () => void;
  onAddReply: (ticketId: number, message: string, isInternalNote: boolean, authorName: string, updateStatus?: TicketStatus) => void;
  onUpdateStatus: (ticketId: number, status: TicketStatus, priority: TicketPriority) => void;
  onOpenDiagnosticsModal?: (website: Website) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  website,
  onClose,
  onAddReply,
  onUpdateStatus,
  onOpenDiagnosticsModal,
}) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [authorName, setAuthorName] = useState('Support Team');
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const [newPriority, setNewPriority] = useState<TicketPriority>(ticket.priority);
  const [quickStatusUpdate, setQuickStatusUpdate] = useState<TicketStatus | ''>('');

  const diagnosis = website ? diagnoseWebsiteError(website) : null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onAddReply(
      ticket.id,
      replyMessage.trim(),
      isInternalNote,
      authorName.trim() || 'Support Team',
      quickStatusUpdate || undefined
    );
    setReplyMessage('');
    setQuickStatusUpdate('');
  };

  const handleStatusChange = (status: TicketStatus) => {
    setNewStatus(status);
    onUpdateStatus(ticket.id, status, newPriority);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    setNewPriority(priority);
    onUpdateStatus(ticket.id, newStatus, priority);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-blue-400 font-bold text-sm bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/60">
              #{ticket.ticket_number}
            </span>
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
              {ticket.category}
            </span>
            {ticket.is_automated_incident && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-red-950/80 text-red-400 border border-red-800/60">
                <ShieldAlert className="w-3.5 h-3.5" /> Outage Incident
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left 2 Cols: Ticket Subject, Description, and Conversation Thread */}
          <div className="lg:col-span-2 p-6 space-y-6 overflow-y-auto">
            
            {/* Subject & Description */}
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 space-y-3">
              <h2 className="text-lg font-bold text-white leading-snug">
                {{ ...ticket }.subject}
              </h2>
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {ticket.description}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Created {ticket.created_at}</span>
                <span>Last activity {ticket.updated_at}</span>
              </div>
            </div>

            {/* Conversation Replies Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Conversation Thread ({ticket.replies.length})
                </h3>
              </div>

              {ticket.replies.length > 0 ? (
                <div className="space-y-3">
                  {ticket.replies.map(reply => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl border transition ${
                        reply.is_internal_note
                          ? 'bg-amber-950/20 border-amber-800/50'
                          : reply.is_staff
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-blue-950/15 border-blue-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {reply.author_name}
                          </span>
                          {reply.is_internal_note ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50">
                              <Lock className="w-2.5 h-2.5" /> Staff Note Only
                            </span>
                          ) : reply.is_staff ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/40">
                              Support Agent
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              Client
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{reply.created_at}</span>
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {reply.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-950/30 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No replies yet. Use the message box below to post a response or record a private staff note.
                </div>
              )}
            </div>

            {/* Post Reply Form */}
            <form onSubmit={handleSendReply} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      !isInternalNote
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Public Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isInternalNote
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Internal Staff Note
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Agent:</span>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-28 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={
                  isInternalNote
                    ? 'Write a private internal note (visible to staff only)...'
                    : 'Write a response message to the client...'
                }
                rows={3}
                className={`w-full p-3 rounded-lg text-sm text-white placeholder-slate-500 border focus:outline-none ${
                  isInternalNote
                    ? 'bg-amber-950/10 border-amber-800/40 focus:border-amber-500'
                    : 'bg-slate-900 border-slate-700 focus:border-blue-500'
                }`}
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Also update status to:</span>
                  <select
                    value={quickStatusUpdate}
                    onChange={(e) => setQuickStatusUpdate(e.target.value as TicketStatus | '')}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Keep current ({ticket.status})</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting on Client</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInternalNote ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {isInternalNote ? 'Save Note' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Ticket Metadata & Website Status */}
          <div className="p-6 space-y-6 bg-slate-950/30 text-sm">
            
            {/* Status & Priority Controls */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Status & Priority</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Current Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting on Client</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Priority Level</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Target Monitored Website */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Monitored Site</h4>
              {website ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{website.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      website.is_active && website.logs[0]?.is_up
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                        : 'bg-red-950/80 text-red-400 border border-red-800/60'
                    }`}>
                      {website.logs[0]?.is_up ? 'ONLINE' : 'DOWN'}
                    </span>
                  </div>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 break-all"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    {website.url}
                  </a>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                    <span>Check Interval:</span>
                    <span className="font-mono text-slate-200">Every {website.check_interval_minutes}m</span>
                  </div>
                  {website.logs[0] && (
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Latest Response:</span>
                      <span className="font-mono text-slate-200">
                        {website.logs[0].response_time_ms ? `${website.logs[0].response_time_ms} ms` : 'Failed'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500">Website data not found.</div>
              )}

              {/* Automated Root Cause & Remediation Guide Box */}
              {diagnosis && (
                <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-3.5 space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Root Cause Diagnosis</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-300 font-bold">
                      {diagnosis.severity}
                    </span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block text-[11px]">Origin Layer:</span>
                    <span className="font-bold text-white">{diagnosis.layerTitle}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block text-[11px]">Source Component:</span>
                    <span className="font-mono text-rose-300 font-semibold">{diagnosis.sourceComponent}</span>
                  </div>

                  <div className="text-xs text-slate-300 pt-1 border-t border-rose-900/40">
                    <span className="text-slate-400 block text-[11px] font-bold">How to fix:</span>
                    <span className="leading-snug">{diagnosis.remediationSteps[0]}</span>
                  </div>

                  {diagnosis.remediationCommands.length > 0 && (
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-cyan-300 overflow-x-auto">
                      {diagnosis.remediationCommands[0].split('\n')[0]}
                    </div>
                  )}

                  {onOpenDiagnosticsModal && website && (
                    <button
                      onClick={() => onOpenDiagnosticsModal(website)}
                      className="w-full mt-1 py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Open Full Fix Blueprint</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Requester Details */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Requester Contact</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-white">{ticket.requester_name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${ticket.requester_email}`} className="text-blue-400 hover:underline">
                    {ticket.requester_email}
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>ChrisTech Omni-Site Support Desk</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
