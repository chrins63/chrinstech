import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Layers, Terminal, BookOpen } from 'lucide-react';
import { CODE_DELIVERABLES } from '../data/codeFiles';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(CODE_DELIVERABLES[0]);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Backend', 'Logic', 'Templates', 'Config', 'Documentation'];

  const filteredFiles = activeCategory === 'All' 
    ? CODE_DELIVERABLES 
    : CODE_DELIVERABLES.filter(f => f.category === activeCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAllZip = () => {
    // We provide a data download or let user know
    const element = document.createElement("a");
    const file = new Blob([selectedFile.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = selectedFile.filename.replace('/', '_');
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>ChrisTech Deliverables Explorer</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Python (Flask) & PostgreSQL Source Code</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            All files are generated at the root of the workspace. You can export the repository to GitHub/ZIP from AI Studio Settings, or copy individual modules directly below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-selected-code-btn"
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : `Copy ${selectedFile.filename}`}</span>
          </button>
          <button
            id="download-file-btn"
            onClick={handleDownloadAllZip}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* File List Column */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Project Files ({filteredFiles.length})
          </div>
          <div className="space-y-1.5">
            {filteredFiles.map((file) => (
              <button
                key={file.filename}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                  selectedFile.filename === file.filename
                    ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>{file.filename}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {file.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {file.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Code Content Column */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="ml-3 font-mono text-xs font-bold text-slate-200">
                {selectedFile.filename}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ({selectedFile.language})
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-blue-950/20 border-b border-slate-800/60 text-xs text-blue-300">
            💡 {selectedFile.description}
          </div>

          {/* Pre Code Box */}
          <div className="p-4 overflow-x-auto max-h-[600px] font-mono text-xs text-slate-300 leading-relaxed">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
