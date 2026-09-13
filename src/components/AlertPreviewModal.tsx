import React, { useState } from 'react';
import { X, Mail, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { Website } from '../types';

interface AlertPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  website: Website | null;
}

export const AlertPreviewModal: React.FC<AlertPreviewModalProps> = ({ isOpen, onClose, website }) => {
  const [alertType, setAlertType] = useState<'down' | 'up'>('down');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !website) return null;

  const isDown = alertType === 'down';
  const subject = isDown 
    ? `[ALERT] ChrisTech Monitor: '${website.name}' is DOWN` 
    : `[RESOLVED] ChrisTech Monitor: '${website.name}' is UP`;

  const copyEmailHtml = () => {
    navigator.clipboard.writeText(subject);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        id="alert-preview-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SMTP Email Alert Simulation</h3>
              <p className="text-xs text-slate-400">Preview emails dispatched by <code className="text-blue-300">notifier.py</code></p>
            </div>
          </div>
          <button 
            id="close-alert-preview-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Alert Type */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAlertType('down')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDown 
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-600/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Outage Alert (DOWN)</span>
            </button>
            <button
              onClick={() => setAlertType('up')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isDown 
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-600/30' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recovery Alert (UP)</span>
            </button>
          </div>

          <button
            onClick={copyEmailHtml}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-md"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Subject Copied' : 'Copy Subject'}</span>
          </button>
        </div>

        {/* Email Client Preview Container */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Email Envelope Header */}
          <div className="bg-slate-950 border border-slate-800 rounded-t-xl p-4 text-xs font-mono space-y-1.5">
            <div><span className="text-slate-500">From:</span> <span className="text-slate-200">ChrisTech Monitor &lt;alerts@christech.local&gt;</span></div>
            <div><span className="text-slate-500">To:</span> <span className="text-slate-200">your-team@example.com</span></div>
            <div><span className="text-slate-500">Subject:</span> <span className="text-white font-bold">{subject}</span></div>
          </div>

          {/* Email Render Body */}
          <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-xl p-6">
            <div className={`border-l-4 pl-4 mb-4 ${isDown ? 'border-rose-500' : 'border-emerald-500'}`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDown ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isDown ? '🔴 Outage Detected' : '🟢 Service Recovered'}
              </div>
              <h2 className="text-lg font-bold text-white">
                Website <span className="underline decoration-blue-500">{website.name}</span> is {isDown ? 'DOWN' : 'ONLINE'}
              </h2>
            </div>

            <table className="w-full text-xs text-left mb-4 border border-slate-800 rounded overflow-hidden">
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-slate-950/40">
                  <td className="py-2 px-3 text-slate-400 font-semibold w-1/3">Target URL</td>
                  <td className="py-2 px-3 font-mono text-blue-400">{website.url}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400 font-semibold">HTTP Status Code</td>
                  <td className="py-2 px-3 font-mono font-bold text-white">{isDown ? '503 (Service Unavailable)' : '200 OK'}</td>
                </tr>
                <tr className="bg-slate-950/40">
                  <td className="py-2 px-3 text-slate-400 font-semibold">Response Time</td>
                  <td className="py-2 px-3 font-mono text-white">{isDown ? '1,842 ms' : '142 ms'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400 font-semibold">Trigger Reason</td>
                  <td className="py-2 px-3 text-slate-300 font-mono">
                    {isDown ? 'HTTP error response or keyword mismatch' : 'Health check succeeded'}
                  </td>
                </tr>
              </tbody>
            </table>

            {isDown && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg text-xs text-rose-300 font-mono">
                <strong>Diagnostic Error:</strong> HTTP 503: Backend upstream connection failed / timed out after 10 seconds.
              </div>
            )}

            <div className="text-[11px] text-slate-500 mt-6 pt-4 border-t border-slate-800 text-center">
              Dispatched automatically by ChrisTech notifier daemon. Alerts only fire when status changes.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">Configure SMTP in <code className="text-blue-300">.env</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
