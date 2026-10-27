import { useState, useEffect } from 'react';
import {
  Zap,
  FolderTree,
  Terminal,
  Sparkles,
  Server,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { ARCH_TARGETS, ArchTarget, FeedFile } from './data/packageData';
import { INITIAL_FEED_FILES } from './data/initialFeedFiles';
import { Header } from './components/Header';
import { BetterWayTab } from './components/BetterWayTab';
import { FeedExplorerTab } from './components/FeedExplorerTab';
import { ProxmoxWizardTab } from './components/ProxmoxWizardTab';
import { BuildAutomationTab } from './components/BuildAutomationTab';
import { AIAssistantTab } from './components/AIAssistantTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('better-way');
  const [selectedArch, setSelectedArch] = useState<ArchTarget>(ARCH_TARGETS[0]);
  const [corosyncVersion, setCorosyncVersion] = useState<string>('3.2.0');
  const [feedFiles, setFeedFiles] = useState<FeedFile[]>(INITIAL_FEED_FILES);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to fetch feed files from local server if running
    fetch('/api/feed/files')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.files) && data.files.length > 0) {
          const mapped: FeedFile[] = data.files.map((f: any, idx: number) => {
            let cat: FeedFile['category'] = 'build';
            if (f.relativePath.startsWith('corosync/')) cat = 'corosync';
            else if (f.relativePath.startsWith('corosync-qdevice/')) cat = 'qdevice';
            else if (f.relativePath.startsWith('lib') || f.relativePath.startsWith('ns')) cat = 'libraries';

            let lang = 'Makefile';
            if (f.relativePath.endsWith('.sh') || f.relativePath.endsWith('.init')) lang = 'bash';
            else if (f.relativePath.endsWith('.conf') || f.relativePath.endsWith('.pc')) lang = 'conf';
            else if (f.relativePath.endsWith('.yml') || f.relativePath.endsWith('.yaml')) lang = 'yaml';
            else if (f.relativePath.endsWith('.md')) lang = 'markdown';
            else if (f.relativePath.endsWith('Dockerfile')) lang = 'dockerfile';

            return {
              id: `api-file-${idx}`,
              name: f.relativePath.split('/').pop() || f.relativePath,
              path: f.relativePath,
              category: cat,
              description: `OpenWrt feed package component: ${f.relativePath}`,
              content: f.content,
              language: lang,
            };
          });
          setFeedFiles(mapped);
        }
      })
      .catch(() => {
        // Fallback silently to INITIAL_FEED_FILES
      });
  }, []);

  const handleDownloadFeed = () => {
    setIsDownloading(true);
    // Trigger download from backend or construct blob
    window.location.href = '/api/feed/download';
    setTimeout(() => setIsDownloading(false), 2500);
  };

  const tabs = [
    {
      id: 'better-way',
      label: 'The Better Way',
      badge: 'Upgrades',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'feed',
      label: 'Feed Explorer',
      badge: `${feedFiles.length} files`,
      icon: <FolderTree className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'wizard',
      label: 'Proxmox 2-Node Quorum',
      badge: 'Live Simulator',
      icon: <Server className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'build',
      label: 'Build Pipeline & SDK',
      badge: selectedArch.archString,
      icon: <Terminal className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'ai',
      label: 'Gemini Cluster Advisor',
      badge: 'AI Systems',
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <Header
        selectedArch={selectedArch}
        onSelectArch={setSelectedArch}
        corosyncVersion={corosyncVersion}
        onToggleVersion={setCorosyncVersion}
        onDownloadFeed={handleDownloadFeed}
        isDownloading={isDownloading}
      />

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'better-way' && (
          <BetterWayTab
            selectedArch={selectedArch}
            corosyncVersion={corosyncVersion}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'feed' && (
          <FeedExplorerTab
            files={feedFiles}
          />
        )}

        {activeTab === 'wizard' && (
          <ProxmoxWizardTab />
        )}

        {activeTab === 'build' && (
          <BuildAutomationTab
            selectedArch={selectedArch}
            onSelectArch={setSelectedArch}
            corosyncVersion={corosyncVersion}
            onDownloadFeed={handleDownloadFeed}
            isDownloading={isDownloading}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantTab
            selectedArch={selectedArch}
            corosyncVersion={corosyncVersion}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OpenWrt 23.05-SNAPSHOT • Corosync 3.2.0 • Kronosnet 1.35 • Libqb 2.0.10</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <a
              href="https://github.com/corosync/corosync/releases"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              Corosync Releases <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com/kronosnet/kronosnet/releases"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              Kronosnet Releases <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://downloads.openwrt.org/releases/23.05.5/targets/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              OpenWrt 23.05 SDK Targets <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
