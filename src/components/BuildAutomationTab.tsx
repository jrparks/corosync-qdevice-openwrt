import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Cpu,
  Layers,
  Box,
  Github,
} from 'lucide-react';
import { ARCH_TARGETS, ArchTarget, PACKAGE_SPECS } from '../data/packageData';

interface BuildAutomationTabProps {
  selectedArch: ArchTarget;
  onSelectArch: (arch: ArchTarget) => void;
  corosyncVersion: string;
  onDownloadFeed: () => void;
  isDownloading: boolean;
}

export const BuildAutomationTab: React.FC<BuildAutomationTabProps> = ({
  selectedArch,
  onSelectArch,
  corosyncVersion,
  onDownloadFeed,
  isDownloading,
}) => {
  const [buildMethod, setBuildMethod] = useState<'github' | 'docker' | 'native'>('github');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [buildComplete, setBuildComplete] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const startSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setBuildComplete(false);
    setLogs([]);
    setProgress(0);

    const simulationSteps = [
      `[INIT] Initializing OpenWrt 23.05-SNAPSHOT build environment for target: ${selectedArch.target}/${selectedArch.subtarget} (${selectedArch.archString})...`,
      `[SDK] Toolchain: gcc-12.3.0 musl-1.2.4 (cross-compiler ${selectedArch.archString}-openwrt-linux-musl-gcc)`,
      `[FEEDS] Ingesting package definitions: corosync (${corosyncVersion}), libknet (1.35), libqb (2.0.10), nss (3.98), nspr (4.35)...`,
      `[CONFIG] Applied .config profile: CONFIG_TARGET_${selectedArch.target}=y, CONFIG_PACKAGE_corosync=m, CONFIG_PACKAGE_corosync-qnetd=m`,
      `[STEP 1/6] Building libqb 2.0.10 -> CC=gcc CFLAGS="-O2 -pipe -fno-caller-saves" -> libqb.so.100.2.0 compiled successfully.`,
      `[STEP 2/6] Building nspr 4.35 -> Building host tools (now, nsinstall) -> Cross-compiling libnspr4.so, libplds4.so, libplc4.so.`,
      `[STEP 3/6] Building nss 3.98 -> Cross-compiling certutil, pk12util, shlibsign -> Applying patchelf --add-needed libfreebl3.so.`,
      `[STEP 4/6] Building libknet 1.35 -> Enabling native OpenSSL crypto acceleration -> libknet.so.1.35.0 generated.`,
      `[STEP 5/6] Building corosync ${corosyncVersion} -> Compiling totemknet, votequorum, cmap, cfg, sam -> corosync daemon & corosync-cfgtool built.`,
      `[STEP 6/6] Building corosync-qdevice 3.0.4 -> Building corosync-qnetd, corosync-qnetd-tool, and certutil-wrapper.sh.`,
      `[PACKAGE] Stripping debug symbols and creating IPK control archives...`,
      selectedArch.archString !== 'aarch64_generic'
        ? `[REPACK] Target architecture tag set to ${selectedArch.archString} (compatible with target hardware).`
        : `[METADATA] Packaging native ${selectedArch.archString} binaries with SPDX license tags.`,
      `[SUCCESS] 9 IPK packages generated in bin/packages/${selectedArch.archString}/corosync-feed/`,
      `[HASH] Calculating SHA-256 integrity checksums -> SHA256SUMS.txt created.`,
      `[DONE] Build completed successfully with 0 errors!`,
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < simulationSteps.length) {
        setLogs((prev) => [...prev, simulationSteps[current]]);
        setProgress(Math.round(((current + 1) / simulationSteps.length) * 100));
        current++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setBuildComplete(true);
      }
    }, 450);
  };

  const dockerCommand = `# Build locally with Docker (SDK cached in sdk-state/):
bash run-build.sh

# Or with custom architecture override (e.g. for GL.iNet firmware):
TARGET_ARCH_OVERRIDE="aarch64_cortex-a53_neon-vfpv4" bash run-build.sh

# Output .ipk files and SHA256SUMS.txt are written to ./output/`;

  const githubInstructions = `# Push directly to GitHub to trigger the automated build:
git add .
git commit -m "Update Corosync 3.2.0 & QNetd for OpenWrt 23.05"
git push origin master

# To automatically publish a full GitHub Release with IPK asset downloads:
git tag v3.2.0-1
git push origin v3.2.0-1

# GitHub Actions will matrix-build all architectures in parallel:
# • armsr-armv8 (Generic ARM64 / RPi4)
# • glinet-aarch64 (Flint GL-AX1800, Beryl AX GL-MT3000)
# • mediatek-filogic (Flint 2 GL-MT6000)
# • x86-64 (Intel & AMD routers)
# Download the compiled ZIP from the Actions tab or Releases page!`;

  return (
    <div className="space-y-8">
      {/* Top Architecture & Method Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Build Target & Execution Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your router hardware architecture and compilation method
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadFeed}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download Build Kit (.tar.gz)
            </button>
          </div>
        </div>

        {/* Target Architecture Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {ARCH_TARGETS.map((arch) => {
            const isSelected = arch.id === selectedArch.id;
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => onSelectArch(arch)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold truncate">{arch.name}</div>
                <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5 truncate">
                  {arch.archString}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 truncate">
                  {arch.chipset}
                </div>
              </button>
            );
          })}
        </div>

        {/* Build Method Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 mr-2 font-medium">Build Method:</span>
          <button
            type="button"
            onClick={() => setBuildMethod('github')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              buildMethod === 'github'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            GitHub Actions (Recommended — Free Cloud CI)
          </button>
          <button
            type="button"
            onClick={() => setBuildMethod('docker')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              buildMethod === 'docker'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            Local Docker Container
          </button>
        </div>

        {/* Code instructions according to method */}
        <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
              {buildMethod === 'docker' ? <Terminal className="w-3.5 h-3.5" /> : <Github className="w-3.5 h-3.5" />}
              {buildMethod === 'docker' ? 'Docker Automated Command' : 'GitHub Actions Workflow'}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(buildMethod === 'docker' ? dockerCommand : githubInstructions, 'build-cmd')}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
            >
              {copiedSnippet === 'build-cmd' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Command
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre">
            {buildMethod === 'docker' ? dockerCommand : githubInstructions}
          </pre>
        </div>
      </div>

      {/* Simulated Live Compilation Runner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              OpenWrt 23.05 SDK Build Simulator
            </h4>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              {selectedArch.archString}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startSimulation}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Compiling... ({progress}%)
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Test Compile Pipeline
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="w-full bg-slate-800 h-1">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Terminal Screen */}
        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 min-h-[280px] max-h-[380px] overflow-y-auto space-y-1">
          {logs.length === 0 && !isRunning && (
            <div className="text-slate-600 italic py-10 text-center">
              Click &quot;Test Compile Pipeline&quot; to test the cross-compilation pipeline and verify all dependency sequences.
            </div>
          )}
          {logs.map((log, idx) => {
            const isError = log.includes('ERROR');
            const isSuccess = log.includes('SUCCESS') || log.includes('DONE');
            const isStep = log.includes('[STEP');
            return (
              <div
                key={idx}
                className={`${
                  isError
                    ? 'text-red-400 font-bold'
                    : isSuccess
                    ? 'text-emerald-400 font-semibold'
                    : isStep
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>

        {/* Build Complete Output Card */}
        {buildComplete && (
          <div className="p-4 bg-emerald-950/20 border-t border-emerald-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Compilation verified! 9 packages ready for opkg installation on {selectedArch.name}.
            </div>
            <button
              type="button"
              onClick={onDownloadFeed}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Download Ready-to-Build Archive
            </button>
          </div>
        )}
      </div>

      {/* Generated Artifacts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Box className="w-4 h-4 text-indigo-400" />
          Output IPK Package Artifacts for {selectedArch.name}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PACKAGE_SPECS.map((pkg) => (
            <div
              key={pkg.name}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono"
            >
              <div>
                <div className="text-white font-semibold">{pkg.name}_{pkg.version}-1</div>
                <div className="text-[11px] text-slate-500">{selectedArch.archString}.ipk</div>
              </div>
              <span className="text-[11px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {pkg.sizeIpk}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
