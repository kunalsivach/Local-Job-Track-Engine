import React, { useState } from 'react';
import { Search, Download, Edit3, AlertCircle, ArrowUpDown } from 'lucide-react';
import { RecruiterResponse, STAGE_CONFIG, CHANNEL_CONFIG } from '../types.js';

interface DisclosedTermsMatrixProps {
  responses: RecruiterResponse[];
  onSelectResponse: (response: RecruiterResponse) => void;
  onOpenNewReply: () => void;
}

export const DisclosedTermsMatrix: React.FC<DisclosedTermsMatrixProps> = ({
  responses,
  onSelectResponse,
  onOpenNewReply,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'company' | 'claimedLastWorkingDay' | 'noticePeriodStated' | 'expectedSalary'>('company');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = responses.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      r.company.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.claimedLastWorkingDay.toLowerCase().includes(q) ||
      r.noticePeriodStated.toLowerCase().includes(q) ||
      r.expectedSalary.toLowerCase().includes(q) ||
      r.channel.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const handleSort = (field: 'company' | 'claimedLastWorkingDay' | 'noticePeriodStated' | 'expectedSalary') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const headers = ['Company', 'Role', 'Channel', 'Recruiter', 'Claimed Last Working Day', 'Notice Period Promised', 'Expected CTC', 'Stage', 'Next Action'];
    const rows = sorted.map((r) => [
      `"${r.company.replace(/"/g, '""')}"`,
      `"${r.role.replace(/"/g, '""')}"`,
      r.channel,
      `"${r.recruiterName.replace(/"/g, '""')}"`,
      `"${r.claimedLastWorkingDay.replace(/"/g, '""')}"`,
      `"${r.noticePeriodStated.replace(/"/g, '""')}"`,
      `"${r.expectedSalary.replace(/"/g, '""')}"`,
      STAGE_CONFIG[r.stage]?.label || r.stage,
      `"${(r.nextAction || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `offertrail_disclosed_terms_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Disclosed Terms & Claims Matrix
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cross-reference the exact Last Working Day and Notice Period you told each company to avoid interview discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search claims..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50"
            />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Disclosed Terms Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                <th
                  onClick={() => handleSort('company')}
                  className="py-3 px-4 cursor-pointer hover:text-neutral-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Company & Role</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Channel</th>
                <th
                  onClick={() => handleSort('claimedLastWorkingDay')}
                  className="py-3 px-4 cursor-pointer hover:text-neutral-900 select-none whitespace-nowrap bg-neutral-100/40"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-900 font-bold">Claimed Last Working Day</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('noticePeriodStated')}
                  className="py-3 px-4 cursor-pointer hover:text-neutral-900 select-none whitespace-nowrap bg-neutral-100/40"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-900 font-bold">Notice Promised</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('expectedSalary')}
                  className="py-3 px-4 cursor-pointer hover:text-neutral-900 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Expected CTC</span>
                    <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  </div>
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Stage</th>
                <th className="py-3 px-4 whitespace-nowrap">Upcoming Action</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No disclosed terms found matching your query.
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectResponse(r)}
                    className="hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Company & Role */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 text-xs">{r.company}</div>
                      <div className="text-[11px] text-neutral-500">{r.role}</div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-4 text-neutral-600 font-medium whitespace-nowrap">
                      {CHANNEL_CONFIG[r.channel]?.label || r.channel}
                    </td>

                    {/* Claimed LWD (Crucial Focus) */}
                    <td className="py-3 px-4 bg-neutral-50/50">
                      <div className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                        {r.claimedLastWorkingDay}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                        {r.notes || 'No custom note'}
                      </div>
                    </td>

                    {/* Notice Period Promised */}
                    <td className="py-3 px-4 bg-neutral-50/50">
                      <div className="font-mono tabular-nums font-bold text-neutral-900 text-xs">
                        {r.noticePeriodStated}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {r.recruiterName || 'Direct'}
                      </div>
                    </td>

                    {/* Expected CTC */}
                    <td className="py-3 px-4 font-mono tabular-nums text-neutral-800 font-semibold whitespace-nowrap">
                      {r.expectedSalary}
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs text-neutral-700 font-medium">
                        {STAGE_CONFIG[r.stage]?.label || r.stage}
                      </span>
                    </td>

                    {/* Upcoming Action */}
                    <td className="py-3 px-4 text-neutral-600 max-w-xs truncate">
                      {r.nextAction ? (
                        <div>
                          <p className="truncate font-medium text-neutral-800">{r.nextAction}</p>
                          {r.nextActionDate && (
                            <p className="text-[10px] font-mono text-neutral-400">
                              {new Date(r.nextActionDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400">None scheduled</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectResponse(r);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
                        title="View details & edit terms"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
