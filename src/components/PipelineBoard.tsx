import React, { useState } from 'react';
import {
  Search,
  MessageSquare,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { RecruiterResponse, PipelineStage, ContactChannel, STAGE_CONFIG, CHANNEL_CONFIG } from '../types.js';

interface PipelineBoardProps {
  responses: RecruiterResponse[];
  onSelectResponse: (response: RecruiterResponse) => void;
  onUpdateStage: (id: string, newStage: PipelineStage) => void;
  onOpenNewReply: () => void;
  onSyncChannel: (channel: 'linkedin' | 'whatsapp' | 'gmail') => void;
  onSyncAll: () => void;
  isSyncing: boolean;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  responses,
  onSelectResponse,
  onUpdateStage,
  onOpenNewReply,
  onSyncChannel,
  onSyncAll,
  isSyncing,
}) => {
  const [activeStage, setActiveStage] = useState<string>('all');
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const stageCounts = responses.reduce((acc, r) => {
    acc[r.stage] = (acc[r.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeTotal = responses.filter((r) => r.stage !== 'archived').length;

  const filtered = responses.filter((r) => {
    if (activeStage === 'all' && r.stage === 'archived') return false;
    if (activeStage !== 'all' && r.stage !== activeStage) return false;
    if (activeChannel !== 'all' && r.channel !== activeChannel) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        r.company.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.recruiterName.toLowerCase().includes(q) ||
        r.claimedLastWorkingDay.toLowerCase().includes(q) ||
        r.noticePeriodStated.toLowerCase().includes(q) ||
        r.expectedSalary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1-Click Extraction Action Strip */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Direct Browser Extraction:</span>
            </span>
            <span className="text-xs text-neutral-500 hidden sm:inline">
              (Reads open tabs via Chrome port 9222)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSyncChannel('linkedin')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync LinkedIn / Instahyre</span>
            </button>

            <button
              onClick={() => onSyncChannel('whatsapp')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync WhatsApp Web</span>
            </button>

            <button
              onClick={() => onSyncChannel('gmail')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Gmail Tab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Stage Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search & Channel Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, recruiter, notice period, or salary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-neutral-500 whitespace-nowrap">Channel:</span>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveChannel('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeChannel === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All
              </button>
              {(['linkedin', 'instahyre', 'email', 'whatsapp', 'phone'] as ContactChannel[]).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setActiveChannel(ch)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeChannel === ch ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {CHANNEL_CONFIG[ch]?.label || ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-neutral-100 pt-3">
          <button
            onClick={() => setActiveStage('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeStage === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <span>All Active Inbound</span>
            <span className="text-[10px] font-mono tabular-nums opacity-80">({activeTotal})</span>
          </button>

          {(['initial_outreach', 'screening', 'interviews', 'offer', 'archived'] as PipelineStage[]).map((st) => {
            const count = stageCounts[st] || 0;
            return (
              <button
                key={st}
                onClick={() => setActiveStage(st)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeStage === st
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <span>{STAGE_CONFIG[st].label}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Response Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-neutral-900 text-sm">No recruiter responses yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Your tracker is clean and ready. Open your LinkedIn, WhatsApp Web, or Gmail in Chrome, then click <strong className="text-neutral-800">Sync All Tabs</strong> above to pull new replies automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors border border-neutral-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All Tabs</span>
            </button>
            <button
              onClick={onOpenNewReply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Reply Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectResponse(r)}
              className="group bg-white border border-neutral-200 hover:border-neutral-900/60 rounded-xl p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                      {r.company}
                    </h3>
                    <p className="text-xs font-medium text-neutral-600 line-clamp-1">
                      {r.role}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {new Date(r.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Recruiter & Channel metadata line (Zero-pill text) */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
                  <span>{r.recruiterName || 'Direct Outreach'}</span>
                  <span aria-hidden="true" className="text-neutral-300">·</span>
                  <span className="font-medium text-neutral-700">{CHANNEL_CONFIG[r.channel]?.label || r.channel}</span>
                </div>

                {/* Disclosed Terms Grid (Claimed LWD, Notice Period, CTC) */}
                <div className="mt-3.5 pt-3 border-t border-neutral-100 bg-neutral-50/70 -mx-4 px-4 py-2.5 space-y-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                        Claimed LWD
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums line-clamp-1" title={r.claimedLastWorkingDay}>
                        {r.claimedLastWorkingDay}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                        Notice Given
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums line-clamp-1">
                        {r.noticePeriodStated}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                        Expected CTC
                      </span>
                      <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums line-clamp-1">
                        {r.expectedSalary}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Action / Follow up */}
                {r.nextAction && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-neutral-700 bg-neutral-100/60 p-2 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="line-clamp-1 font-medium">{r.nextAction}</p>
                      {r.nextActionDate && (
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {new Date(r.nextActionDate).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Quick Stage Progression */}
              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-neutral-500">Stage:</span>
                  <select
                    value={r.stage}
                    onChange={(e) => onUpdateStage(r.id, e.target.value as PipelineStage)}
                    className="text-xs font-semibold text-neutral-800 bg-transparent border-0 hover:bg-neutral-100 rounded px-1 py-0.5 focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                  >
                    {(['initial_outreach', 'screening', 'interviews', 'offer', 'archived'] as PipelineStage[]).map((st) => (
                      <option key={st} value={st}>
                        {STAGE_CONFIG[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => onSelectResponse(r)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
