import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { ArchTarget } from '../data/packageData';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

interface AIAssistantTabProps {
  selectedArch: ArchTarget;
  corosyncVersion: string;
}

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({
  selectedArch,
  corosyncVersion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: `Hello! I am your OpenWrt & Corosync Systems Engineer assistant. I can help you with:

1. **Cross-compiling Corosync ${corosyncVersion} & Kronosnet 1.35** on OpenWrt 23.05-SNAPSHOT musl toolchains.
2. **Proxmox VE 2-node HA quorum setup & debugging** (\`pvecm qdevice setup\` certificate errors, SFTP issues).
3. **OpenWrt firewall (fw4/nftables)** rules for TCP 5403.
4. **Hardware-specific optimizations** for ${selectedArch.name} (${selectedArch.archString}).

Click a preset chip below or ask any technical question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const promptChips = [
    'How do I fix "subsystem request failed on channel 0" during pvecm setup?',
    'What are the advantages of Corosync 3.2.0 over 3.0.4 for OpenWrt?',
    'How does Kronosnet 1.35 handle multi-link failover on dual router WANs?',
    'Can I run corosync-qnetd under a non-root user on OpenWrt 23.05?',
    `How to adapt this feed for OpenWrt target ${selectedArch.target}?`,
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          context: {
            openwrtVersion: '23.05-SNAPSHOT',
            corosyncVersion,
            targetArch: selectedArch,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'gemini',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: Message = {
          id: `bot-err-${Date.now()}`,
          sender: 'gemini',
          text: data.error || 'Unable to connect to Gemini API. Please check your environment GEMINI_API_KEY.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'gemini',
        text: `Error contacting server: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col min-h-[620px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gemini OpenWrt & Cluster Engineering Advisor
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                gemini-3.8-flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ask about musl libc quirks, Proxmox tie-breaker tuning, or custom router target Makefiles
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          Target: {selectedArch.archString}
        </span>
      </div>

      {/* Preset Chips */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-500 flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" /> Presets:
        </span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="shrink-0 bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/80 transition-colors text-[11px]"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[480px]">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-70">
                  <span className="font-semibold">{isUser ? 'You' : 'OpenWrt Systems Advisor'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>

                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => copyText(m.text, m.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Answer
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-900 border border-indigo-700 flex items-center justify-center text-indigo-200 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Thinking and formulating OpenWrt cross-compilation guidance...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about OpenWrt 23.05 SDK Makefiles, Corosync 3, or Proxmox HA setup..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
