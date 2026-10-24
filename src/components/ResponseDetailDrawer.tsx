import React from 'react';
import { X, Calendar, Clock, Edit, Trash2, ExternalLink, Copy, Check, MessageSquare } from 'lucide-react';
import { RecruiterResponse, PipelineStage, STAGE_CONFIG, CHANNEL_CONFIG } from '../types.js';

interface ResponseDetailDrawerProps {
  response: RecruiterResponse | null;
  onClose: () => void;
  onEdit: (response: RecruiterResponse) => void;
  onDelete: (id: string) => void;
  onUpdateStage: (id: string, stage: PipelineStage) => void;
}

export const ResponseDetailDrawer: React.FC<ResponseDetailDrawerProps> = ({
  response,
  onClose,
  onEdit,
  onDelete,
  onUpdateStage,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!response) return null;

  const handleCopySnippet = () => {
    if (response.rawSnippet) {
      navigator.clipboard.writeText(response.rawSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{response.company}</h2>
            <p className="text-sm font-medium text-neutral-600">{response.role}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
              <span>{response.recruiterName || 'Direct Outreach'}</span>
              <span aria-hidden="true">·</span>
              <span>{CHANNEL_CONFIG[response.channel]?.label || response.channel}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Highlighted Terms Box */}
          <div className="bg-neutral-900 text-white rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Disclosed Terms Stated
              </span>
              <span className="text-[11px] text-neutral-400">Strictly tracked</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                  Claimed Last Working Day
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-white">
                  {response.claimedLastWorkingDay}
                </span>
                <p className="text-[10px] text-neutral-400 mt-0.5">Told to {response.company}</p>
              </div>

              <div>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                  Notice Period Promised
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-white">
                  {response.noticePeriodStated}
                </span>
                <p className="text-[10px] text-neutral-400 mt-0.5">Expected joining buffer</p>
              </div>

              <div>
                <span className="block text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                  Expected Salary Quoted
                </span>
                <span className="text-sm font-semibold font-mono tabular-nums text-neutral-200">
                  {response.expectedSalary}
                </span>
              </div>

              {response.currentSalary && (
                <div>
                  <span className="block text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Current Salary
                  </span>
                  <span className="text-sm font-semibold font-mono tabular-nums text-neutral-200">
                    {response.currentSalary}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current Stage Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Pipeline Stage
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['initial_outreach', 'screening', 'interviews', 'offer', 'archived'] as PipelineStage[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStage(response.id, st)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-all ${
                    response.stage === st
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  {STAGE_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Action */}
          {response.nextAction && (
            <div className="space-y-1.5 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Next Scheduled Step</span>
              </span>
              <p className="text-xs font-medium text-neutral-800">{response.nextAction}</p>
              {response.nextActionDate && (
                <p className="text-xs text-neutral-500 font-mono">
                  {new Date(response.nextActionDate).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {response.notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Conversation Notes
              </span>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 whitespace-pre-wrap">
                {response.notes}
              </div>
            </div>
          )}

          {/* Raw Message Excerpt */}
          {response.rawSnippet && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Original Message Snippet</span>
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-neutral-900 text-neutral-200 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                {response.rawSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50/50">
          <button
            onClick={() => {
              if (confirm(`Delete tracking record for ${response.company}?`)) {
                onDelete(response.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => {
              onEdit(response);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Terms</span>
          </button>
        </div>
      </div>
    </div>
  );
};
