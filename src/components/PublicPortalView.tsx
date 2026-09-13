import React, { useState } from 'react';
import { Globe, CheckCircle2, AlertTriangle, Send, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { Website, TicketCategory, TicketPriority } from '../types';

interface PublicPortalViewProps {
  websites: Website[];
  onSubmitTicket: (ticketData: {
    website_id: number;
    subject: string;
    description: string;
    requester_name: string;
    requester_email: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
  onGoToSupportDesk: () => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  websites,
  onSubmitTicket,
  onGoToSupportDesk,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<number>(websites[0]?.id || 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('general');
  const [message, setMessage] = useState('');
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState<string | null>(null);

  const selectedSite = websites.find(w => w.id === selectedSiteId) || websites[0];
  const isUp = selectedSite?.logs[0]?.is_up ?? true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    const generatedNumber = `CT-${Math.floor(10000 + Math.random() * 90000)}`;
    onSubmitTicket({
      website_id: selectedSite.id,
      subject: subject.trim(),
      description: message.trim(),
      requester_name: name.trim(),
      requester_email: email.trim(),
      category,
      priority: 'medium',
    });

    setSubmittedTicketNumber(generatedNumber);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & Website Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Public Customer Support Portal</h2>
          </div>
          <p className="text-sm text-slate-400">
            This is the customer-facing ticket submission page hosted for each website you build.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 shrink-0 font-medium">Viewing portal for:</label>
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(Number(e.target.value));
              setSubmittedTicketNumber(null);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            {websites.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulated Portal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Browser Top Chrome */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="ml-3 px-3 py-1 bg-slate-950 rounded-md text-xs font-mono text-slate-400 border border-slate-800 flex items-center gap-1.5">
              <span>https://christech.local/support/portal/{selectedSite?.id}</span>
            </div>
          </div>
          <span className="text-xs text-slate-500">Live Client View</span>
        </div>

        {/* Portal Body */}
        <div className="p-8 max-w-xl mx-auto">
          {/* Brand & Status Banner */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
            <div>
              <h3 className="text-xl font-black text-white">{selectedSite?.name} Support</h3>
              <p className="text-xs text-slate-400 mt-0.5">Official Help & Inquiries Desk</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isUp
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-red-950/80 text-red-400 border border-red-800/60'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isUp ? 'Systems Operational' : 'Service Disrupted'}
              </span>
            </div>
          </div>

          {submittedTicketNumber ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h4 className="text-xl font-bold text-white">Support Ticket Submitted!</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Thank you! Your inquiry has been routed to our technical desk. We will follow up via email shortly.
              </p>
              <div className="inline-block bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg font-mono text-sm text-blue-400 font-bold">
                Ticket Reference: #{submittedTicketNumber}
              </div>
              <div className="pt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setSubmittedTicketNumber(null)}
                  className="text-xs text-slate-400 hover:text-white underline transition"
                >
                  Submit another ticket
                </button>
                <button
                  onClick={onGoToSupportDesk}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  View in Support Desk <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Experiencing an issue with <strong className="text-white">{selectedSite?.name}</strong> or need help? Fill out the form below and our team will get right on it.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Lee"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jordan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Topic / Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="general">General Question</option>
                  <option value="bug">Report a Bug / Glitch</option>
                  <option value="performance">Slow Response or Timeout</option>
                  <option value="billing">Account / Billing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="How can we help you?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Message Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide details about what happened..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                Submit Support Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
