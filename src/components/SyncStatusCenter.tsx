import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles
} from 'lucide-react';
import { api, SyncStatus } from '../services/api.js';

interface SyncStatusCenterProps {
  onRefreshResponses: () => void;
  onClearAll: () => void;
}

export const SyncStatusCenter: React.FC<SyncStatusCenterProps> = ({
  onRefreshResponses,
  onClearAll,
}) => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test Ingestion
  const [testText, setTestText] = useState(
    `Hi Kunal, we reviewed your profile for Senior Frontend at Razorpay. What is your expected CTC, notice period, and claimed last working day?\n\nKunal: Hi, my expected CTC is 35 LPA. I am serving notice with my claimed last working day on Nov 25th (15-day notice period).`
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const s = await api.getSyncStatus();
      setStatus(s);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunTest = async () => {
    if (!testText.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.ingestRawText('test_simulator', testText);
      setTestResult(res);
      onRefreshResponses();
    } catch (err: any) {
      setTestResult({ error: err.message || 'Parsing failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const cdpMacCommand = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir="/Users/$(whoami)/Library/Application Support/Google/Chrome"`;
  const cdpLinuxCommand = `google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"`;
  const cdpWinCommand = `& "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\\Google\\Chrome\\User Data"`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neutral-900" />
            <span>Local Sync & Multi-Key LLM Pool Status</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor Chrome DevTools Protocol reachability, detected open tabs, and configured AI failover keys.
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-200 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Chrome CDP Status & Tabs */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-900" />
                <span>Chrome Remote Debugging (Port 9222)</span>
              </h3>
              {status?.cdpStatus?.connected ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Waiting on Port 9222</span>
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-neutral-600">
                When Chrome is running with remote debugging enabled, OfferTrail automatically reads your open tabs without requiring any login credentials:
              </p>

              {status?.cdpStatus?.connected && status.cdpStatus.tabs.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                    Detected Target Tabs:
                  </span>
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50/50">
                    {status.cdpStatus.tabs.map((t, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="font-semibold text-neutral-900 block truncate">{t.platform}</span>
                          <span className="text-[11px] text-neutral-500 truncate block">{t.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">Ready to Sync</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                  <p className="text-neutral-600 text-xs font-medium">
                    To start Chrome with remote debugging on your machine, close normal Chrome and run in your terminal:
                  </p>
                  <div className="relative">
                    <pre className="text-xs font-mono bg-neutral-900 text-neutral-200 p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap select-all pr-10">
                      {cdpMacCommand}
                    </pre>
                    <button
                      onClick={() => handleCopy(cdpMacCommand, 'cdp-copy')}
                      className="absolute right-2 top-2 p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                      title="Copy command"
                    >
                      {copiedId === 'cdp-copy' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Database Reset */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-neutral-900" />
              <span>Clean Database Reset</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Clear all saved recruiter responses and start fresh with an empty ledger.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all tracked responses?')) {
                  onClearAll();
                }
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
            >
              Clear All Tracked Data
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Key LLM Failover Status & Simulator */}
        <div className="space-y-6">
          {/* Failover Pool Status */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-900" />
                <span>Multi-Key LLM Failover Pool</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Configured keys in your local <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">.env</code> file:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">Gemini Keys</span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-0.5 block">
                  {status?.llmStatus?.geminiCount || 0}
                </span>
                <span className="text-[10px] text-neutral-400">Primary</span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">Groq Keys</span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-0.5 block">
                  {status?.llmStatus?.groqCount || 0}
                </span>
                <span className="text-[10px] text-neutral-400">Ultra-fast</span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                <span className="block text-[10px] uppercase font-bold text-neutral-500">OpenAI Keys</span>
                <span className="text-lg font-bold font-mono text-neutral-900 mt-0.5 block">
                  {status?.llmStatus?.openAiCount || 0}
                </span>
                <span className="text-[10px] text-neutral-400">Backup</span>
              </div>
            </div>

            <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1">
              <p className="font-semibold text-neutral-800">Automatic Failover Policy:</p>
              <p>
                When a recruiter message is parsed, the engine tries your first key. If it hits a quota or rate-limit error, it immediately falls over to the next key or provider without failing.
              </p>
            </div>
          </div>

          {/* Test AI Parsing Simulator */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Message Extraction</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Paste any message snippet below to test parsing and observe which key/provider extracts the terms:
            </p>

            <textarea
              rows={3}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-2.5 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50"
            />

            <button
              onClick={handleRunTest}
              disabled={isTesting || !testText.trim()}
              className="w-full py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing with LLM Pool...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Extraction</span>
                </>
              )}
            </button>

            {testResult && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-1.5 font-mono">
                {testResult.error ? (
                  <span className="text-red-600 font-bold">{testResult.error}</span>
                ) : (
                  <>
                    <div className="text-neutral-900 font-bold">
                      Extracted: {testResult.response?.company} ({testResult.response?.role})
                    </div>
                    <div className="text-neutral-700">
                      Claimed LWD: <span className="font-bold">{testResult.response?.claimedLastWorkingDay}</span>
                    </div>
                    <div className="text-neutral-700">
                      Notice Period: <span className="font-bold">{testResult.response?.noticePeriodStated}</span>
                    </div>
                    <div className="text-neutral-700">
                      Expected CTC: <span className="font-bold">{testResult.response?.expectedSalary}</span>
                    </div>
                    <div className="text-emerald-700 font-semibold pt-1 border-t border-neutral-200">
                      Provider Used: {testResult.parsed?.providerUsed || 'Gemini'}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
