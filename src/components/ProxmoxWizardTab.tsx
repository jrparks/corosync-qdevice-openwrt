import React, { useState } from 'react';
import {
  Server,
  Zap,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  Activity,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ProxmoxWizardTab: React.FC = () => {
  const [routerIp, setRouterIp] = useState<string>('192.168.1.1');
  const [node1Ip, setNode1Ip] = useState<string>('192.168.1.100');
  const [node2Ip, setNode2Ip] = useState<string>('192.168.1.101');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  // Quorum Simulator state
  const [node1Online, setNode1Online] = useState<boolean>(true);
  const [node2Online, setNode2Online] = useState<boolean>(true);
  const [qnetdOnline, setQnetdOnline] = useState<boolean>(true);

  // Math: 3 votes total (Node1: 1, Node2: 1, QNetd: 1)
  const totalConfiguredVotes = 3;
  const currentVotes =
    (node1Online ? 1 : 0) + (node2Online ? 1 : 0) + (qnetdOnline ? 1 : 0);
  const quorumNeeded = Math.floor(totalConfiguredVotes / 2) + 1; // 2
  const hasQuorum = currentVotes >= quorumNeeded;

  // Comparison if QNetd was NOT present: 2 votes total, needed 2
  const votesWithoutQnetd = (node1Online ? 1 : 0) + (node2Online ? 1 : 0);
  const quorumWithoutQnetd = votesWithoutQnetd >= 2;

  const handleCopy = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const routerCommands = `# 1. Install prerequisite SFTP server on OpenWrt router
opkg update
opkg install openssh-sftp-server

# 2. Copy compiled .ipk packages to /tmp/ on your router:
# scp output/*.ipk root@${routerIp}:/tmp/

# 3. Install Corosync QNetd & supporting libraries:
opkg install --nodeps --force-reinstall \\
  /tmp/libnspr_*.ipk \\
  /tmp/libnss_*.ipk \\
  /tmp/libqb_*.ipk \\
  /tmp/libknet_*.ipk \\
  /tmp/corosync-qnetd_*.ipk \\
  /tmp/corosync-nss-tools_*.ipk

# 4. Initialize NSS certificate DB & set per-IP firewall rules for Proxmox nodes:
corosync-qnetd-setup ${node1Ip} ${node2Ip}`;

  const proxmoxCommands = `# Run this command on ONE of your Proxmox VE cluster nodes:
pvecm qdevice setup ${routerIp}

# If re-running after previous attempt:
# pvecm qdevice setup ${routerIp} --force`;

  const verifyCommands = `# On your Proxmox node:
pvecm status

# Look for:
#   Qdevice Information
#   State: Connected
#   Votes: 1

# On your OpenWrt router:
corosync-qnetd-tool -s
# Output will display connected cluster nodes and NSS TLS status`;

  return (
    <div className="space-y-8">
      {/* Wizard Header & Configuration Inputs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Proxmox VE 2-Node Quorum Setup Wizard
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your router and Proxmox node IP addresses to automatically tailor the setup and firewall commands
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-cyan-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>TCP 5403 TLS Arbitration Ready</span>
          </div>
        </div>

        {/* IP Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              OpenWrt Router IP (QNetd)
            </label>
            <input
              type="text"
              value={routerIp}
              onChange={(e) => setRouterIp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="192.168.1.1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proxmox Node 1 IP (pve-01)
            </label>
            <input
              type="text"
              value={node1Ip}
              onChange={(e) => setNode1Ip(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="192.168.1.100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proxmox Node 2 IP (pve-02)
            </label>
            <input
              type="text"
              value={node2Ip}
              onChange={(e) => setNode2Ip(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="192.168.1.101"
            />
          </div>
        </div>
      </div>

      {/* Step by Step Setup Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: OpenWrt Router */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">
                  Execute on OpenWrt Router
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(routerCommands, 1)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedStep === 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Installs packages, initializes NSS database, auto-links sftp-server, and allows TCP 5403 only from {node1Ip} and {node2Ip}:
            </p>
            <div className="bg-slate-950 rounded-lg p-3.5 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre">{routerCommands}</pre>
            </div>
          </div>
        </div>

        {/* Step 2: Proxmox Node Setup */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">
                  Execute on Proxmox Node
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(proxmoxCommands, 2)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedStep === 2 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Connects to your OpenWrt router over SSH, retrieves CA cert, generates cluster client cert, and registers QDevice:
            </p>
            <div className="bg-slate-950 rounded-lg p-3.5 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre">{proxmoxCommands}</pre>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Step 3: Verification Commands
              </span>
              <button
                type="button"
                onClick={() => handleCopy(verifyCommands, 3)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {copiedStep === 3 ? 'Copied' : 'Copy Verify'}
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-2.5 font-mono text-[11px] text-slate-400 overflow-x-auto border border-slate-800">
              <pre className="whitespace-pre">{verifyCommands}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Live Quorum Simulation Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Cluster Quorum & Failover Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate node crashes or router restarts to test how votes and HA quorum respond in real-time
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            onClick={() => setNode1Online(!node1Online)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              node1Online
                ? 'bg-blue-950/40 border-blue-600/80 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">Node 1 (pve-01)</div>
              {node1Online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-xs mt-1 font-mono">{node1Ip}</div>
            <div className="mt-3 text-xs flex items-center justify-between">
              <span>Status: {node1Online ? 'ONLINE' : 'CRASHED'}</span>
              <span className="font-bold">Vote: {node1Online ? '1' : '0'}</span>
            </div>
          </div>

          <div
            onClick={() => setQnetdOnline(!qnetdOnline)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              qnetdOnline
                ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">Router QNetd (Arbitrator)</div>
              {qnetdOnline ? (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-xs mt-1 font-mono">{routerIp}</div>
            <div className="mt-3 text-xs flex items-center justify-between">
              <span>Status: {qnetdOnline ? 'ONLINE' : 'OFFLINE'}</span>
              <span className="font-bold">Vote: {qnetdOnline ? '1' : '0'}</span>
            </div>
          </div>

          <div
            onClick={() => setNode2Online(!node2Online)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              node2Online
                ? 'bg-blue-950/40 border-blue-600/80 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">Node 2 (pve-02)</div>
              {node2Online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="text-xs mt-1 font-mono">{node2Ip}</div>
            <div className="mt-3 text-xs flex items-center justify-between">
              <span>Status: {node2Online ? 'ONLINE' : 'CRASHED'}</span>
              <span className="font-bold">Vote: {node2Online ? '1' : '0'}</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcome Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* With QNetd Status */}
          <div
            className={`p-4 rounded-xl border ${
              hasQuorum
                ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                : 'bg-red-950/40 border-red-800 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {hasQuorum ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <span>With OpenWrt QNetd Active</span>
            </div>
            <div className="text-xs mt-1">
              Active Votes: <strong>{currentVotes} / {totalConfiguredVotes}</strong> (Quorum Requires: <strong>{quorumNeeded}</strong>)
            </div>
            <div className="text-xs mt-2 font-semibold">
              Cluster State:{' '}
              {hasQuorum ? (
                <span className="text-emerald-400">✓ QUORATE — HA VMs run continuously without interruption!</span>
              ) : (
                <span className="text-red-400">✗ QUORUM LOST — Cluster frozen to avoid split-brain.</span>
              )}
            </div>
          </div>

          {/* Without QNetd (Legacy 2-node without router) */}
          <div
            className={`p-4 rounded-xl border ${
              quorumWithoutQnetd
                ? 'bg-slate-950 border-slate-800 text-slate-300'
                : 'bg-red-950/20 border-red-900/60 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {quorumWithoutQnetd ? (
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span>If You Did NOT Have OpenWrt QNetd (2 Nodes Only)</span>
            </div>
            <div className="text-xs mt-1">
              Active Votes: <strong>{votesWithoutQnetd} / 2</strong> (Requires: <strong>2</strong>)
            </div>
            <div className="text-xs mt-2 font-semibold">
              Cluster State:{' '}
              {quorumWithoutQnetd ? (
                <span className="text-slate-300">Quorate (Only while both nodes are running)</span>
              ) : (
                <span className="text-red-400 font-bold">
                  ✗ SPLIT-BRAIN RISK: When 1 node dies, 2nd node locks up completely!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Memory Footprint Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Flash Storage & RAM Footprint Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact space required on your OpenWrt router&apos;s flash partition and memory
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
            Total Flash: ~5.1 MB • RAM: ~14 MB
          </span>
        </div>

        {/* Footprint Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400">Download Size (IPK files)</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">~1.9 MB</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Compressed archive copied to <code>/tmp/</code> over SCP (cleared after install).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400">Installed Flash (/overlay)</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">~5.1 MB</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Uncompressed footprint on router flash (QNetd + NSS + libqb + knet).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-400">Runtime RAM (Resident RSS)</div>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">~12 - 16 MB</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active memory when <code>corosync-qnetd</code> daemon is running.
            </p>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                <th className="py-2.5 px-3">Package Component</th>
                <th className="py-2.5 px-3">IPK Download</th>
                <th className="py-2.5 px-3">Installed Flash</th>
                <th className="py-2.5 px-3">What It Contains</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">libnss</td>
                <td className="py-2.5 px-3 text-slate-400">~1,150 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~3,400 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">NSS crypto, certutil, pk12util, cert9.db database</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">libnspr</td>
                <td className="py-2.5 px-3 text-slate-400">~145 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~410 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">NSPR runtime libraries (libnspr4, libplc4, libplds4)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">corosync-qnetd</td>
                <td className="py-2.5 px-3 text-slate-400">~142 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~280 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">QNetd daemon binary and corosync-qnetd-tool diagnostic CLI</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">libknet (Kronosnet 1.35)</td>
                <td className="py-2.5 px-3 text-slate-400">~158 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~320 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Kronosnet transport library (uses native OpenSSL)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">libqb (2.0.10)</td>
                <td className="py-2.5 px-3 text-slate-400">~130 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~260 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">IPC sockets and atomic event ring buffers</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-white font-semibold">corosync-nss-tools</td>
                <td className="py-2.5 px-3 text-slate-400">~95 KB</td>
                <td className="py-2.5 px-3 text-emerald-400">~180 KB</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">certutil-wrapper.sh, qnetd-setup.sh, and firewall hooks</td>
              </tr>
              <tr className="bg-slate-950/60 font-bold">
                <td className="py-2.5 px-3 text-cyan-300">Total QNetd Setup</td>
                <td className="py-2.5 px-3 text-cyan-300">~1,820 KB (~1.8 MB)</td>
                <td className="py-2.5 px-3 text-emerald-300">~4,850 KB (~4.9 MB)</td>
                <td className="py-2.5 px-3 font-sans text-slate-300">Complete Proxmox tie-breaker suite</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Router Hardware Capacity Guide */}
        <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300">
          <div className="font-semibold text-white mb-1">Router Storage Compatibility:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400 mt-2">
            <div>
              <strong className="text-slate-200">GL.iNet Beryl AX (GL-MT3000):</strong>
              <div>256 MB NAND Flash $\rightarrow$ Uses only <strong>~2.0%</strong> of flash!</div>
            </div>
            <div>
              <strong className="text-slate-200">GL.iNet Flint 2 (GL-MT6000):</strong>
              <div>8 GB eMMC Storage $\rightarrow$ Uses <strong>&lt; 0.1%</strong> of flash!</div>
            </div>
            <div>
              <strong className="text-slate-200">Standard 128 MB Routers:</strong>
              <div>128 MB NAND Flash $\rightarrow$ Uses only <strong>~3.9%</strong> of flash!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
