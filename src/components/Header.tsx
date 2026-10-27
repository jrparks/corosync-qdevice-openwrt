import React from 'react';
import { Download, Cpu, ShieldCheck, Box, Network, RefreshCw } from 'lucide-react';
import { ARCH_TARGETS, ArchTarget } from '../data/packageData';

interface HeaderProps {
  selectedArch: ArchTarget;
  onSelectArch: (arch: ArchTarget) => void;
  corosyncVersion: string;
  onToggleVersion: (version: string) => void;
  onDownloadFeed: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedArch,
  onSelectArch,
  corosyncVersion,
  onToggleVersion,
  onDownloadFeed,
  isDownloading,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Badges */}
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Corosync & QNetd for OpenWrt
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono">
                    23.05-SNAPSHOT
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production-grade cross-compilation feed & Proxmox VE quorum arbitration suite
                </p>
              </div>
            </div>

            {/* Version Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-xs text-slate-300 border border-slate-700/80 font-mono">
                <Box className="w-3 h-3 text-cyan-400" />
                <span>Corosync:</span>
                <span className="font-semibold text-cyan-300">{corosyncVersion}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-xs text-slate-300 border border-slate-700/80 font-mono">
                <Network className="w-3 h-3 text-emerald-400" />
                <span>Kronosnet:</span>
                <span className="font-semibold text-emerald-300">1.35</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-xs text-slate-300 border border-slate-700/80 font-mono">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span>libqb:</span>
                <span className="font-semibold text-indigo-300">2.0.10</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-xs text-slate-300 border border-slate-700/80 font-mono">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>QDevice / QNetd:</span>
                <span className="font-semibold text-amber-300">3.0.4</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/90 text-xs text-slate-300 border border-slate-700/80 font-mono">
                <span className="text-violet-400">musl:</span>
                <span className="font-semibold text-violet-300">1.2.4</span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Version Toggle */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onToggleVersion('3.2.0')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  corosyncVersion === '3.2.0'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                v3.2.0 (Latest)
              </button>
              <button
                type="button"
                onClick={() => onToggleVersion('3.1.10')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  corosyncVersion === '3.1.10'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                v3.1.10 (LTS)
              </button>
            </div>

            {/* Architecture Selector */}
            <div className="relative">
              <select
                aria-label="Target Architecture"
                value={selectedArch.id}
                onChange={(e) => {
                  const found = ARCH_TARGETS.find((a) => a.id === e.target.value);
                  if (found) onSelectArch(found);
                }}
                className="bg-slate-800 text-slate-200 text-xs border border-slate-700 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none font-medium"
              >
                {ARCH_TARGETS.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    Target: {arch.name}
                  </option>
                ))}
              </select>
              <Cpu className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Download Feed Button */}
            <button
              type="button"
              onClick={onDownloadFeed}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Repo (.tar.gz)
                </>
              )}
            </button>

            {/* Git Bundle Button */}
            <a
              href="/api/feed/bundle"
              download="corosync-qnetd-openwrt.bundle"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors"
              title="Download entire Git repository with all commit history"
            >
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              Git Bundle (.bundle)
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
