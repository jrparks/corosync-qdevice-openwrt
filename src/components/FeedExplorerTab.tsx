import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Folder,
  Copy,
  Check,
  Search,
  Download,
  Terminal,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { FeedFile } from '../data/packageData';

interface FeedExplorerTabProps {
  files: FeedFile[];
  onDownloadFile?: (file: FeedFile) => void;
}

export const FeedExplorerTab: React.FC<FeedExplorerTabProps> = ({ files }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    files[0]?.id || 'corosync-make'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === 'all' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [files, searchQuery, selectedCategory]);

  const activeFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || filteredFiles[0] || files[0];
  }, [files, selectedFileId, filteredFiles]);

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'corosync':
        return <Layers className="w-3.5 h-3.5 text-cyan-400" />;
      case 'qdevice':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'libraries':
        return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
      case 'build':
        return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white font-mono">
            package/corosync/
          </span>
          <span className="text-xs text-slate-400">
            ({files.length} packages & build definitions)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {['all', 'corosync', 'qdevice', 'libraries', 'build'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 pl-8 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left File Tree Column */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40 p-2 overflow-y-auto max-h-[620px]">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
            Package Tree
          </div>
          <div className="space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/80 font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`}
                >
                  {getCategoryIcon(file.category)}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono">{file.path}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredFiles.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching files found.
              </div>
            )}
          </div>
        </div>

        {/* Right Code Viewer Column */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/80">
          {activeFile ? (
            <>
              {/* File Header Details */}
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {activeFile.path}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {activeFile.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeFile.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Code
                      </>
                    )}
                  </button>

                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(activeFile.content)}`}
                    download={activeFile.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>

              {/* Code Display with Line Numbers */}
              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[560px] overflow-y-auto leading-relaxed text-slate-300 select-text">
                <pre className="table">
                  {activeFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row hover:bg-slate-900/60">
                      <span className="table-cell pr-4 text-right select-none text-slate-600 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="table-cell whitespace-pre">{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-slate-500 text-sm">
              Select a file from the left to view contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
