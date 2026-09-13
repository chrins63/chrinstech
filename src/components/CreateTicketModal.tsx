import React, { useState } from 'react';
import { X, Headphones, Globe, AlertTriangle } from 'lucide-react';
import { Website, TicketCategory, TicketPriority } from '../types';

interface CreateTicketModalProps {
  websites: Website[];
  onClose: () => void;
  onSubmit: (ticketData: {
    website_id: number;
    subject: string;
    description: string;
    requester_name: string;
    requester_email: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
  preselectedSiteId?: number;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  websites,
  onClose,
  onSubmit,
  preselectedSiteId,
}) => {
  const [websiteId, setWebsiteId] = useState<number>(preselectedSiteId || websites[0]?.id || 1);
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !requesterName.trim() || !requesterEmail.trim()) {
      return;
    }
    onSubmit({
      website_id: websiteId,
      subject: subject.trim(),
      description: description.trim(),
      requester_name: requesterName.trim(),
      requester_email: requesterEmail.trim(),
      category,
      priority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">New Support Ticket</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Target Website */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Monitored Website *
            </label>
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              {websites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.url})
                </option>
              ))}
            </select>
          </div>

          {/* Requester Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Client / Requester Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Requester Email *
              </label>
              <input
                type="email"
                placeholder="e.g. alex@example.com"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="general">General Support</option>
                <option value="bug">Bug Report / Broken Function</option>
                <option value="outage">Outage / Downtime Incident</option>
                <option value="performance">Slow Response / Latency</option>
                <option value="billing">Account / Billing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Major impact)</option>
                <option value="urgent">Urgent (Critical Outage)</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject *
            </label>
            <input
              type="text"
              placeholder="Brief summary of the issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Issue Description / Error Details *
            </label>
            <textarea
              rows={4}
              placeholder="Explain the problem, steps to reproduce, or diagnostic details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-sm transition"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
