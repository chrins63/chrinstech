import React, { useState } from 'react';
import { X, Globe, Tag, Clock, Key } from 'lucide-react';
import { Website } from '../types';

interface AddWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (website: Omit<Website, 'id' | 'created_at' | 'logs'>) => void;
}

export const AddWebsiteModal: React.FC<AddWebsiteModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(5);
  const [keyword, setKeyword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onAdd({
      name: name.trim(),
      url: formattedUrl,
      check_interval_minutes: Number(interval) || 5,
      keyword: keyword.trim() || null,
      is_active: true
    });

    setName('');
    setUrl('');
    setInterval(5);
    setKeyword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="add-website-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Website to Monitor</h3>
              <p className="text-xs text-slate-400">Configure URL, frequency, and keyword verification</p>
            </div>
          </div>
          <button 
            id="close-add-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Website Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              id="input-site-name"
              type="text"
              required
              placeholder="e.g., Company Homepage, API Gateway"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Website URL <span className="text-rose-500">*</span></span>
            </label>
            <input
              id="input-site-url"
              type="text"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">HTTP or HTTPS protocol required. Checked with 10s timeout.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Interval (Min)</span>
              </label>
              <input
                id="input-site-interval"
                type="number"
                min="1"
                max="1440"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Periodic ping cadence</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Keyword Check</span>
              </label>
              <input
                id="input-site-keyword"
                type="text"
                placeholder="e.g., Welcome, OK"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Required string in HTML</p>
            </div>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-lg text-xs text-blue-300/90 leading-relaxed">
            💡 <strong>Keyword check tip:</strong> If set, the site is marked DOWN if this text is missing from HTML body, even if the server returns 200 OK!
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="cancel-add-site-btn"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-site-btn"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition-colors"
            >
              Save & Start Monitoring
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
