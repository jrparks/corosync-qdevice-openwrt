import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { COMPARISON_POINTS, PACKAGE_SPECS, ArchTarget } from '../data/packageData';

interface BetterWayTabProps {
  selectedArch: ArchTarget;
  corosyncVersion: string;
  onNavigateTab: (tab: string) => void;
}

export const BetterWayTab: React.FC<BetterWayTabProps> = ({
  selectedArch,
  corosyncVersion,
  onNavigateTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const categories = ['all', 'Cluster Engine', 'Crypto & Hardware', 'Security & CVEs', 'Packaging & SDK', 'Proxmox Integration'];

  const filteredPoints = activeCategory === 'all'
    ? COMPARISON_POINTS
    : COMPARISON_POINTS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Hero Banner / What is the Better Way */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Architectural Modernization: 2026 Edition
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Architectural Modernization: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">Corosync 3 & QNetd for OpenWrt</span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-4xl leading-relaxed">
            Running high-availability cluster components on resource-constrained embedded routers requires a tailored architecture.
            Unlike earlier ad-hoc builds that only compiled a bare quorum daemon, forced sluggish NSS crypto onto <code>libknet</code>,
            or relied on manual repack loops, this modernized feed delivers the complete <strong>Corosync 3.2.0</strong> and <strong>QNetd 3.0.4</strong> suite
            engineered specifically for <strong>OpenWrt 23.05</strong> and modern <strong>Proxmox VE (7 / 8 / 9)</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Full Corosync {corosyncVersion} Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Not just qnetd: builds <code>corosync</code>, <code>corosync-tools</code>, and <code>libcorosync</code> with full procd lifecycle.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Hardware OpenSSL Acceleration</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kronosnet 1.35 leverages router ARM Cryptography Extensions (NEON/CE) instead of CPU-heavy NSS encryption.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Proxmox 7/8/9 Certified</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fixed OpenSSL 3.x PKCS#12 legacy cipher handling & automatic Dropbear sftp-server symlinking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Cluster Quorum Topology Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              Quorum Topology & High Availability Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              How the OpenWrt router acts as the 3rd voter to prevent split-brain without purchasing extra physical servers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('wizard')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            Launch Interactive Wizard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Node 1 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 text-center relative shadow-lg">
            <div className="inline-block p-3 rounded-full bg-blue-950 border border-blue-700 text-blue-400 mb-2">
              <Server className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Proxmox Node 1 (pve-01)</h4>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">192.168.1.100</p>
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200">
              Votes: <strong className="ml-1 text-emerald-400">1</strong>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Runs corosync 3 & corosync-qdevice client
            </div>
          </div>

          {/* Router / QNetd Arbitrator */}
          <div className="bg-gradient-to-b from-cyan-950/40 to-slate-900 border-2 border-cyan-500/40 rounded-xl p-5 text-center relative shadow-xl shadow-cyan-950/30">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider">
              External Tie-Breaker
            </span>
            <div className="inline-block p-3 rounded-full bg-cyan-900/60 border border-cyan-600 text-cyan-300 mb-2">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">OpenWrt 23.05 Router</h4>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">{selectedArch.name}</p>
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded bg-slate-900 border border-cyan-800/80 text-xs font-medium text-cyan-200">
              QNetd Vote: <strong className="ml-1 text-cyan-400">1</strong>
            </div>
            <div className="mt-2 text-[11px] text-slate-300">
              TCP Port 5403 (TLS / NSS CA) • Total Votes: <strong className="text-white">3</strong> • Quorum: <strong className="text-emerald-400">2</strong>
            </div>
          </div>

          {/* Node 2 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 text-center relative shadow-lg">
            <div className="inline-block p-3 rounded-full bg-blue-950 border border-blue-700 text-blue-400 mb-2">
              <Server className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Proxmox Node 2 (pve-02)</h4>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">192.168.1.101</p>
            <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200">
              Votes: <strong className="ml-1 text-emerald-400">1</strong>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Runs corosync 3 & corosync-qdevice client
            </div>
          </div>
        </div>

        {/* Quorum Math Explanation */}
        <div className="mt-6 bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-indigo-950 border border-indigo-800 text-indigo-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white">Why 2-Node Clusters Need QNetd:</strong> If Node 1 loses power in a 2-node cluster without QNetd,
              Node 2 only has 1 of 2 votes (50%), losing quorum and instantly freezing VMs.
              With your OpenWrt QNetd router voting, Node 2 has 2 of 3 votes (66.7%), maintaining quorum seamlessly!
            </div>
          </div>
        </div>
      </div>

      {/* Package Specs Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Complete Package Suite & Version Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All 9 packages packaged for OpenWrt 23.05-SNAPSHOT musl toolchain
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700 self-start sm:self-auto">
            Target Arch: {selectedArch.archString}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">New Version</th>
                <th className="py-3 px-4">Legacy Repo</th>
                <th className="py-3 px-4">Est. Size</th>
                <th className="py-3 px-4">Security / Improvements</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {PACKAGE_SPECS.map((pkg) => (
                <tr key={pkg.name} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {pkg.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-cyan-300">
                    {pkg.version}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {pkg.previousVersion}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {pkg.sizeIpk}
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="text-slate-300">{pkg.description}</div>
                    {pkg.securityFixes && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pkg.securityFixes.map((cve) => (
                          <span
                            key={cve}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-red-950/80 text-red-300 border border-red-800/70 font-mono"
                          >
                            {cve}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('feed')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      View .mk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Points Accordion / Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Side-by-Side Architectural Deep Dive
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a category to inspect the exact technical differences and rationale
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  activeCategory === cat
                    ? 'bg-cyan-600 text-white font-medium shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/80'
                }`}
              >
                {cat === 'all' ? 'All Areas' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredPoints.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={item.title}
                className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Previous Approach (Legacy Repo)
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.oldApproach}</p>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Modernized Better Way (This Feed)
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.newApproach}</p>
                    </div>

                    <div className="md:col-span-2 bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-3">
                      <strong className="text-indigo-300">Why this matters in production: </strong>
                      <span className="text-slate-300">{item.whyBetter}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
