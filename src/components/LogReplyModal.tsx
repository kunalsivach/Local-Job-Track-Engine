import React, { useState } from 'react';
import { X, Sparkles, RotateCw, Check } from 'lucide-react';
import { RecruiterResponse, PipelineStage, ContactChannel, COMMON_NOTICE_PERIODS, STAGE_CONFIG, CHANNEL_CONFIG } from '../types.js';
import { api } from '../services/api.js';

interface LogReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RecruiterResponse>) => Promise<void>;
  initialData?: RecruiterResponse | null;
}

export const LogReplyModal: React.FC<LogReplyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [tab, setTab] = useState<'form' | 'ai'>('form');

  // Form states
  const [company, setCompany] = useState(initialData?.company || '');
  const [role, setRole] = useState(initialData?.role || 'Senior Software Engineer');
  const [channel, setChannel] = useState<ContactChannel>(initialData?.channel || 'linkedin');
  const [recruiterName, setRecruiterName] = useState(initialData?.recruiterName || '');
  const [recruiterContact, setRecruiterContact] = useState(initialData?.recruiterContact || '');
  const [stage, setStage] = useState<PipelineStage>(initialData?.stage || 'screening');
  const [claimedLastWorkingDay, setClaimedLastWorkingDay] = useState(initialData?.claimedLastWorkingDay || 'Nov 15, 2026');
  const [noticePeriodStated, setNoticePeriodStated] = useState(initialData?.noticePeriodStated || '30 Days');
  const [expectedSalary, setExpectedSalary] = useState(initialData?.expectedSalary || '₹30 LPA');
  const [currentSalary, setCurrentSalary] = useState(initialData?.currentSalary || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [rawSnippet, setRawSnippet] = useState(initialData?.rawSnippet || '');
  const [nextAction, setNextAction] = useState(initialData?.nextAction || '');
  const [nextActionDate, setNextActionDate] = useState(initialData?.nextActionDate ? initialData.nextActionDate.slice(0, 16) : '');

  // AI Paste State
  const [pasteText, setPasteText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleParsePaste = async () => {
    if (!pasteText.trim()) return;
    setIsParsing(true);
    setErrorMsg('');
    try {
      const parsed = await api.parseTextPreview(pasteText);
      if (parsed) {
        if (parsed.company) setCompany(parsed.company);
        if (parsed.role) setRole(parsed.role);
        if (parsed.channel) setChannel(parsed.channel);
        if (parsed.recruiterName) setRecruiterName(parsed.recruiterName);
        if (parsed.claimedLastWorkingDay) setClaimedLastWorkingDay(parsed.claimedLastWorkingDay);
        if (parsed.noticePeriodStated) setNoticePeriodStated(parsed.noticePeriodStated);
        if (parsed.expectedSalary) setExpectedSalary(parsed.expectedSalary);
        if (parsed.currentSalary) setCurrentSalary(parsed.currentSalary);
        if (parsed.stage) setStage(parsed.stage);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.nextAction) setNextAction(parsed.nextAction);
        if (parsed.nextActionDate) setNextActionDate(parsed.nextActionDate.slice(0, 16));
        setRawSnippet(pasteText);
        setTab('form');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse text snippet');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      setErrorMsg('Company name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        channel,
        recruiterName: recruiterName.trim(),
        recruiterContact: recruiterContact.trim(),
        stage,
        claimedLastWorkingDay: claimedLastWorkingDay.trim() || 'To be specified',
        noticePeriodStated: noticePeriodStated.trim() || '30 Days',
        expectedSalary: expectedSalary.trim() || 'Not specified',
        currentSalary: currentSalary.trim(),
        notes: notes.trim(),
        rawSnippet: rawSnippet.trim(),
        nextAction: nextAction.trim(),
        nextActionDate: nextActionDate ? new Date(nextActionDate).toISOString() : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-base text-neutral-900">
              {initialData ? `Edit Details: ${initialData.company}` : 'Log Recruiter Reply'}
            </h3>
            <p className="text-xs text-neutral-500">
              Keep a record of what last working day and notice period you quoted.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Manual Form vs AI Paste */}
        <div className="flex border-b border-neutral-100 px-6 pt-2 bg-neutral-50/50">
          <button
            type="button"
            onClick={() => setTab('form')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'form'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Detailed Fields
          </button>
          <button
            type="button"
            onClick={() => setTab('ai')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'ai'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Auto-Extract from Chat / Email</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {tab === 'ai' ? (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-900">
                Paste WhatsApp, LinkedIn, or Email Conversation Snippet
              </label>
              <p className="text-xs text-neutral-500">
                The AI will automatically pull out the company, role, recruiter, claimed LWD, notice period, and quoted salary.
              </p>
            </div>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Example:
Recruiter (WhatsApp): Hi Kunal, your profile is shortlisted for Senior Frontend at PhonePe. What is your expected CTC and notice period?
Me: Hi, my expected CTC is 35 LPA, and I am already serving notice with my Last Working Day on Nov 25th (20 days left)."
              className="w-full p-3 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTab('form')}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Back to Form
              </button>
              <button
                type="button"
                onClick={handleParsePaste}
                disabled={isParsing || !pasteText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
              >
                {isParsing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Terms...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Fill Form</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Row 1: Company & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razorpay, Google, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
              </div>
            </div>

            {/* Row 2: Channel & Recruiter Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Contact Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ContactChannel)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  <option value="linkedin">LinkedIn Message</option>
                  <option value="instahyre">Instahyre InMail</option>
                  <option value="email">Gmail / Email</option>
                  <option value="whatsapp">WhatsApp Chat</option>
                  <option value="phone">Phone Call</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Recruiter Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
              </div>
            </div>

            {/* Crucial Section: CLAIMED TERMS (Highlighted Box) */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Disclosed Terms (What You Quoted Them)
                </span>
                <span className="text-[11px] text-neutral-500">Track differences across employers</span>
              </div>

              {/* Claimed Last Working Day */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-900">
                  Claimed Last Working Day (LWD Stated to this Employer) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nov 15, 2026 or Immediate / Already Relieved"
                  value={claimedLastWorkingDay}
                  onChange={(e) => setClaimedLastWorkingDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-medium border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                  <span className="text-[11px] text-neutral-400">Quick set:</span>
                  {['Immediate / Relieved', 'Nov 15, 2026', 'Dec 01, 2026', 'Dec 15, 2026', 'In 15 Days'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setClaimedLastWorkingDay(preset)}
                      className="px-2 py-0.5 text-[11px] font-mono bg-white border border-neutral-200 hover:border-neutral-900 rounded text-neutral-700 whitespace-nowrap transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice Period Promised */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-900">
                  Notice Period Promised / Expected *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {COMMON_NOTICE_PERIODS.map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setNoticePeriodStated(period)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-md border text-center transition-all ${
                        noticePeriodStated === period
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected CTC & Current CTC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-900">Expected CTC / Salary Quoted *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹32 LPA or $165k USD"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-800">Current CTC (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹24 LPA or $125k USD"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Pipeline Stage & Next Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Current Pipeline Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as PipelineStage)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                >
                  {(['initial_outreach', 'screening', 'interviews', 'offer', 'archived'] as PipelineStage[]).map((st) => (
                    <option key={st} value={st}>
                      {STAGE_CONFIG[st].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Next Action / Interview Date</label>
                <input
                  type="datetime-local"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-800">Next Step Description</label>
              <input
                type="text"
                placeholder="e.g. Technical Round 1 on System Design with EM"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-800">Conversation Notes</label>
              <textarea
                rows={2}
                placeholder="Any special remarks, recruiter requirements, or caveats mentioned..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update Response' : 'Save Recruiter Reply'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
