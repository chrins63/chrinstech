import React, { useState } from 'react';
import { Sparkles, Copy, Check, MessageSquare, ExternalLink, Code2, ShieldCheck, Send } from 'lucide-react';
import { Website } from '../types';

interface WidgetStudioViewProps {
  websites: Website[];
}

export const WidgetStudioView: React.FC<WidgetStudioViewProps> = ({ websites }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<number>(websites[0]?.id || 1);
  const [buttonLabel, setButtonLabel] = useState('Support');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copied, setCopied] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const selectedSite = websites.find(w => w.id === selectedSiteId) || websites[0];

  const embedCode = `<!-- ChrisTech Support Widget -->
<script
  src="https://your-christech-instance.com/api/support/widget.js"
  data-website-id="${selectedSite?.id || 1}"
  data-position="${position}"
  data-accent="${accentColor}"
  data-label="${buttonLabel}"
  async
></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Embeddable Support Widget Studio</h2>
          </div>
          <p className="text-sm text-slate-400">
            Generate an embeddable support beacon script to drop into the footer of any website you created.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Customizer & Code Generator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Widget Configuration
            </h3>

            {/* Target Website */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Website
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {websites.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} (#{w.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Button Label */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Floating Button Label
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="e.g. Support, Need Help?"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Screen Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('bottom-right')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    position === 'bottom-right'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Bottom Right
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('bottom-left')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    position === 'bottom-left'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Bottom Left
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Blue', hex: '#2563eb' },
                  { name: 'Indigo', hex: '#4f46e5' },
                  { name: 'Emerald', hex: '#059669' },
                  { name: 'Amber', hex: '#d97706' },
                  { name: 'Purple', hex: '#7c3aed' },
                  { name: 'Rose', hex: '#e11d48' },
                ].map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setAccentColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accentColor === c.hex ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Copy Snippet Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                <Code2 className="w-4 h-4 text-indigo-400" />
                Embed Code Snippet
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
              {embedCode}
            </pre>
            <p className="text-xs text-slate-400">
              Paste this before the closing <code className="text-indigo-300 font-mono">&lt;/body&gt;</code> tag on any of your websites.
            </p>
          </div>
        </div>

        {/* Right 7 Cols: Live Simulated Website Stage */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
            {/* Browser Header */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  {selectedSite?.url || 'https://mywebsite.com'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Live Interactive Simulation</span>
            </div>

            {/* Simulated Website Content Canvas */}
            <div className="relative flex-1 bg-slate-900/50 p-6 overflow-hidden flex flex-col justify-between">
              {/* Mock Website Elements */}
              <div className="space-y-4 opacity-70 pointer-events-none">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="h-5 w-28 bg-slate-800 rounded" />
                  <div className="flex gap-3">
                    <div className="h-4 w-12 bg-slate-800 rounded" />
                    <div className="h-4 w-12 bg-slate-800 rounded" />
                    <div className="h-4 w-12 bg-slate-800 rounded" />
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="h-7 w-3/4 bg-slate-800 rounded" />
                  <div className="h-4 w-1/2 bg-slate-800/80 rounded" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="h-20 bg-slate-800/40 rounded-lg border border-slate-800 p-3">
                    <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
                    <div className="h-2 w-28 bg-slate-800 rounded" />
                  </div>
                  <div className="h-20 bg-slate-800/40 rounded-lg border border-slate-800 p-3">
                    <div className="h-3 w-16 bg-slate-700 rounded mb-2" />
                    <div className="h-2 w-28 bg-slate-800 rounded" />
                  </div>
                </div>
              </div>

              {/* Floating Support Beacon Button & Dialog */}
              <div
                className={`absolute z-30 bottom-6 ${
                  position === 'bottom-right' ? 'right-6' : 'left-6'
                } flex flex-col ${position === 'bottom-right' ? 'items-end' : 'items-start'}`}
              >
                {/* Popup Dialog if toggled open */}
                {isWidgetOpen && (
                  <div className="mb-3 w-80 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <div>
                        <div className="font-bold text-white text-xs">{selectedSite?.name} Support</div>
                        <div className="text-[10px] text-emerald-400">● Agents online</div>
                      </div>
                      <button
                        onClick={() => setIsWidgetOpen(false)}
                        className="text-slate-400 hover:text-white text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs focus:outline-none"
                      />
                      <input
                        type="email"
                        placeholder="Your Email"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="How can we help?"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs focus:outline-none"
                      />
                      <button
                        style={{ backgroundColor: accentColor }}
                        onClick={() => {
                          alert(`Demo Ticket sent to ${selectedSite?.name} support desk!`);
                          setIsWidgetOpen(false);
                        }}
                        className="w-full py-1.5 text-white font-semibold rounded text-xs transition"
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                )}

                {/* Floating Launcher Button */}
                <button
                  onClick={() => setIsWidgetOpen(!isWidgetOpen)}
                  style={{ backgroundColor: accentColor }}
                  className="px-4 py-2.5 rounded-full text-white font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{buttonLabel}</span>
                </button>
              </div>

              {/* Instruction footnote in simulator */}
              <div className="text-center text-xs text-slate-500 pb-2">
                Click the <strong className="text-slate-300">"{buttonLabel}"</strong> button above to test the interactive widget experience.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
