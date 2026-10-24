import React from 'react';
import { Plus, RotateCw, Table, Columns3, RefreshCw, Cpu, Layers } from 'lucide-react';

interface NavbarProps {
  currentTab: 'pipeline' | 'matrix' | 'status';
  onSelectTab: (tab: 'pipeline' | 'matrix' | 'status') => void;
  onOpenNewReply: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
  activeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewReply,
  onSyncAll,
  isSyncing,
  activeCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
            OT
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-neutral-900 whitespace-nowrap">
              OfferTrail
            </span>
            <span className="text-[11px] font-mono text-neutral-400 border-l border-neutral-200 pl-2 hidden sm:inline">
              Local Mode
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('pipeline')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'pipeline'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Pipeline Board</span>
            {activeCount > 0 && (
              <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                currentTab === 'pipeline' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('matrix')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'matrix'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Terms Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('status')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'status'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Sync & LLM Status</span>
          </button>
        </nav>

        {/* Zone 3: 1-Click Sync All & Log Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-200 whitespace-nowrap shrink-0 disabled:opacity-60"
            title="Read open Gmail, WhatsApp Web, and LinkedIn browser tabs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-neutral-900' : 'text-neutral-600'}`} />
            <span>{isSyncing ? 'Syncing Open Tabs...' : 'Sync All Tabs'}</span>
          </button>

          <button
            onClick={onOpenNewReply}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Reply</span>
          </button>
        </div>
      </div>
    </header>
  );
};
