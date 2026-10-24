import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { PipelineBoard } from './components/PipelineBoard.js';
import { DisclosedTermsMatrix } from './components/DisclosedTermsMatrix.js';
import { SyncStatusCenter } from './components/SyncStatusCenter.js';
import { LogReplyModal } from './components/LogReplyModal.js';
import { ResponseDetailDrawer } from './components/ResponseDetailDrawer.js';
import { api } from './services/api.js';
import { RecruiterResponse, PipelineStage } from './types.js';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'pipeline' | 'matrix' | 'status'>('pipeline');
  const [responses, setResponses] = useState<RecruiterResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals & Drawers
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<RecruiterResponse | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<RecruiterResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getResponses();
      setResponses(res);
    } catch (err) {
      console.error('Failed to load responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncAllTabs();
      await loadResponses();
      if (res.count > 0) {
        showToast(`Synced ${res.count} recruiter response(s) from open tabs!`);
      } else {
        showToast(res.message || 'No new messages found in open tabs.');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed. Ensure Chrome is running on port 9222.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncChannel = async (channel: 'linkedin' | 'whatsapp' | 'gmail') => {
    setIsSyncing(true);
    try {
      const res = await api.syncChannel(channel);
      await loadResponses();
      if (res.count > 0) {
        showToast(`Synced ${res.count} response(s) from ${channel}!`);
      } else {
        showToast(res.message || `No new messages found in ${channel}.`);
      }
    } catch (err: any) {
      showToast(err.message || `Failed to sync ${channel}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateStage = async (id: string, newStage: PipelineStage) => {
    setResponses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, stage: newStage, updatedAt: new Date().toISOString() } : r))
    );
    if (selectedResponse && selectedResponse.id === id) {
      setSelectedResponse((prev) => (prev ? { ...prev, stage: newStage } : null));
    }
    try {
      await api.updateResponse(id, { stage: newStage });
      showToast('Stage updated');
    } catch (err) {
      loadResponses();
    }
  };

  const handleSaveResponse = async (data: Partial<RecruiterResponse>) => {
    if (editingResponse) {
      const updated = await api.updateResponse(editingResponse.id, data);
      setResponses((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedResponse && selectedResponse.id === updated.id) {
        setSelectedResponse(updated);
      }
      showToast(`Updated terms for ${updated.company}`);
    } else {
      const created = await api.createResponse(data);
      setResponses((prev) => [created, ...prev]);
      showToast(`Logged reply from ${created.company}`);
    }
    setEditingResponse(null);
  };

  const handleDeleteResponse = async (id: string) => {
    await api.deleteResponse(id);
    setResponses((prev) => prev.filter((r) => r.id !== id));
    showToast('Record deleted');
  };

  const handleClearAll = async () => {
    await api.clearAllResponses();
    setResponses([]);
    showToast('All records cleared');
  };

  const activeCount = responses.filter((r) => r.stage !== 'archived').length;
  const interviewCount = responses.filter((r) => r.stage === 'interviews').length;
  const offerCount = responses.filter((r) => r.stage === 'offer').length;

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col font-sans">
      {/* Navbar adhering to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenNewReply={() => {
          setEditingResponse(null);
          setIsLogModalOpen(true);
        }}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
        activeCount={activeCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick KPI Strip */}
        <section aria-label="Pipeline overview" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
            <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Active Dialogue
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-0.5 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Only who replied</span>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
            <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              In Interviews
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-0.5 block">
              {interviewCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Active technical rounds</span>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
            <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Offers Extended
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-0.5 block">
              {offerCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Decision stage</span>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Chrome CDP Ingest
              </span>
              <span className="text-xs font-semibold text-neutral-900 font-mono mt-1 block">
                Port 9222 Active
              </span>
              <span className="text-[11px] text-neutral-400 block">Zero credentials required</span>
            </div>
          </div>
        </section>

        {/* View Switching */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-neutral-500 font-mono">Loading recruiter ledger...</p>
          </div>
        ) : (
          <>
            {currentTab === 'pipeline' && (
              <PipelineBoard
                responses={responses}
                onSelectResponse={(r) => setSelectedResponse(r)}
                onUpdateStage={handleUpdateStage}
                onOpenNewReply={() => {
                  setEditingResponse(null);
                  setIsLogModalOpen(true);
                }}
                onSyncChannel={handleSyncChannel}
                onSyncAll={handleSyncAll}
                isSyncing={isSyncing}
              />
            )}

            {currentTab === 'matrix' && (
              <DisclosedTermsMatrix
                responses={responses}
                onSelectResponse={(r) => setSelectedResponse(r)}
                onOpenNewReply={() => {
                  setEditingResponse(null);
                  setIsLogModalOpen(true);
                }}
              />
            )}

            {currentTab === 'status' && (
              <SyncStatusCenter
                onRefreshResponses={loadResponses}
                onClearAll={handleClearAll}
              />
            )}
          </>
        )}
      </main>

      {/* Log / Edit Reply Modal */}
      <LogReplyModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingResponse(null);
        }}
        onSave={handleSaveResponse}
        initialData={editingResponse}
      />

      {/* Detail & Audit Drawer */}
      <ResponseDetailDrawer
        response={selectedResponse}
        onClose={() => setSelectedResponse(null)}
        onEdit={(resp) => {
          setEditingResponse(resp);
          setIsLogModalOpen(true);
        }}
        onDelete={handleDeleteResponse}
        onUpdateStage={handleUpdateStage}
      />

      {/* Clean Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
