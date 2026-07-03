import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Inquiry, InquiryStage } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast, Toast } from '../../hooks/useToast';
import { useInquiriesQuery } from '../../hooks/queries/useInquiriesQuery';
import { useUpdateInquiryStatusMutation } from '../../hooks/mutations/useUpdateInquiryStatusMutation';
import { useUpdateInquiryStageMutation } from '../../hooks/mutations/useUpdateInquiryStageMutation';
import { useDeleteInquiryMutation } from '../../hooks/mutations/useDeleteInquiryMutation';

type StatusFilter = 'ALL' | 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
type StageFilter  = 'ALL' | InquiryStage;

const STATUS_OPTIONS: Inquiry['status'][] = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'];
const STAGE_OPTIONS: InquiryStage[]       = ['NEW', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

const STAGE_LABELS: Record<InquiryStage, string> = {
  NEW:           'New',
  QUALIFIED:     'Qualified',
  PROPOSAL_SENT: 'Proposal Sent',
  WON:           'Won',
  LOST:          'Lost',
};

const STAGE_COLORS: Record<InquiryStage, string> = {
  NEW:           'border-slate-500/40 text-slate-400',
  QUALIFIED:     'border-blue-500/40 text-blue-400',
  PROPOSAL_SENT: 'border-violet-500/40 text-violet-400',
  WON:           'border-emerald-500/40 text-emerald-400',
  LOST:          'border-red-500/40 text-red-400',
};

const STAGE_BG: Record<InquiryStage, string> = {
  NEW:           'bg-slate-500/10',
  QUALIFIED:     'bg-blue-500/10',
  PROPOSAL_SENT: 'bg-violet-500/10',
  WON:           'bg-emerald-500/10',
  LOST:          'bg-red-500/10',
};

export default function InquiriesManager() {
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [stageFilter, setStageFilter]   = useState<StageFilter>('ALL');
  const [selected, setSelected]   = useState<Inquiry | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const { toast, showToast }      = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const status = statusFilter === 'ALL' ? undefined : statusFilter;
  const stage  = stageFilter  === 'ALL' ? undefined : stageFilter;

  const { data, isLoading, isFetching } = useInquiriesQuery(page, status, stage);
  const updateStatusMutation = useUpdateInquiryStatusMutation();
  const updateStageMutation  = useUpdateInquiryStageMutation();
  const deleteMutation       = useDeleteInquiryMutation();

  useEffect(() => { setPage(1); }, [statusFilter, stageFilter]);
  useEffect(() => {
    if (!selected) return;
    const next = data?.data.inquiries.find(i => i.id === selected.id) ?? null;
    setSelected(next);
  }, [data, selected?.id]);

  const items      = data?.data.inquiries ?? [];
  const total      = data?.data.total     ?? 0;
  const totalPages = Math.ceil(total / 20);

  // Pipeline summary counts (from current page — full counts need a separate endpoint,
  // but this gives a useful at-a-glance view)
  const stageCounts = useMemo(() => {
    const counts: Record<InquiryStage, number> = { NEW: 0, QUALIFIED: 0, PROPOSAL_SENT: 0, WON: 0, LOST: 0 };
    items.forEach(i => { counts[i.stage] = (counts[i.stage] ?? 0) + 1; });
    return counts;
  }, [items]);

  const unreadCount = useMemo(() => items.filter(i => i.status === 'UNREAD').length, [items]);

  const handleStatus = async (id: string, status: Inquiry['status']) => {
    setUpdatingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (e: any) { showToast(e.response?.data?.error ?? 'Failed to update status', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleStage = async (id: string, stage: InquiryStage) => {
    setUpdatingId(id);
    try {
      await updateStageMutation.mutateAsync({ id, stage });
    } catch (e: any) { showToast(e.response?.data?.error ?? 'Failed to update stage', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
      if (selected?.id === deleteId) setSelected(null);
      showToast('Inquiry deleted');
    } catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
  };

  return (
    <>
      <Helmet><title>Inquiries — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Inquiries</h1>
            <p className="text-slate-500 mt-1">
              {total} total{unreadCount > 0 && <> · <span className="text-red-400 font-medium">{unreadCount} unread</span></>}
            </p>
          </div>
        </div>

        {/* Pipeline stage summary */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {STAGE_OPTIONS.map(s => (
            <button key={s} onClick={() => setStageFilter(stageFilter === s ? 'ALL' : s)}
              className={`p-3 rounded-xl border text-left transition-all ${
                stageFilter === s
                  ? `${STAGE_BG[s]} ${STAGE_COLORS[s]} border-current`
                  : 'bg-surface-900 border-slate-800 hover:border-slate-600'
              }`}>
              <p className={`text-2xl font-bold ${stageFilter === s ? '' : 'text-white'}`}>{stageCounts[s]}</p>
              <p className={`text-xs mt-0.5 ${stageFilter === s ? '' : 'text-slate-500'}`}>{STAGE_LABELS[s]}</p>
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 mb-3 p-1 bg-surface-900 rounded-xl w-fit border border-slate-800">
          {(['ALL', 'UNREAD', 'READ', 'REPLIED', 'ARCHIVED'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === f ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {isFetching && <div className="mb-4 text-xs text-slate-500">Refreshing…</div>}

            <div className="card overflow-hidden mb-4">
              <table className="data-table">
                <thead><tr>
                  <th>From</th><th>Subject</th><th>Service</th>
                  <th>Stage</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <span style={{ fontSize: '32px' }}>📬</span>
                        <p className="font-medium text-white text-sm">No inquiries found</p>
                        <p className="text-xs text-slate-500">
                          {statusFilter !== 'ALL' || stageFilter !== 'ALL'
                            ? 'Try clearing your filters.'
                            : 'Messages from your contact form will appear here.'}
                        </p>
                      </div>
                    </td></tr>
                  )}
                  {items.map(inq => (
                    <motion.tr key={inq.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`cursor-pointer ${inq.status === 'UNREAD' ? 'bg-red-500/3' : ''}`}
                      onClick={() => setSelected(inq)}>
                      <td>
                        <div className={`font-medium ${inq.status === 'UNREAD' ? 'text-white' : 'text-slate-300'}`}>{inq.name}</div>
                        <div className="text-slate-500 text-xs">{inq.email}</div>
                      </td>
                      <td className="max-w-[180px] truncate text-slate-400">{inq.subject}</td>
                      <td>{inq.serviceType ? <span className="tag text-xs px-2">{inq.serviceType}</span> : <span className="text-slate-600">—</span>}</td>

                      {/* Stage */}
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={inq.stage}
                          onChange={e => handleStage(inq.id, e.target.value as InquiryStage)}
                          disabled={updatingId === inq.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer bg-transparent ${STAGE_COLORS[inq.stage]}`}>
                          {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                        </select>
                      </td>

                      {/* Status */}
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={inq.status}
                          onChange={e => handleStatus(inq.id, e.target.value as Inquiry['status'])}
                          disabled={updatingId === inq.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer bg-transparent ${
                            inq.status === 'UNREAD'  ? 'border-red-500/30 text-red-400' :
                            inq.status === 'READ'    ? 'border-blue-500/30 text-blue-400' :
                            inq.status === 'REPLIED' ? 'border-emerald-500/30 text-emerald-400' :
                            'border-amber-500/30 text-amber-400'
                          }`}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      <td className="font-mono text-xs text-slate-500">{new Date(inq.createdAt).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelected(inq)} className="btn-ghost px-3 py-1 text-xs">View</button>
                          <button onClick={() => setDeleteId(inq.id)} className="btn-danger px-3 py-1 text-xs">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost px-4 py-2 text-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Inquiry Details" size="lg">
        {selected && (
          <>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">From</p>
                  <p className="font-semibold text-white">{selected.name}</p>
                  <a href={`mailto:${selected.email}`} className="text-accent text-sm hover:underline">{selected.email}</a>
                </div>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Details</p>
                  {selected.serviceType && <p className="text-slate-400 text-sm mb-1">Service: <span className="text-white">{selected.serviceType}</span></p>}
                  <p className="text-slate-400 text-sm">Received: <span className="text-white font-mono">{new Date(selected.createdAt).toLocaleString()}</span></p>
                  {selected.ipAddress && <p className="text-slate-600 text-xs mt-1">IP: {selected.ipAddress}</p>}
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Subject</p>
                <p className="text-white font-semibold text-lg">{selected.subject}</p>
              </div>

              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Message</p>
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 border-l-4 border-l-accent">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-slate-400 text-sm">Stage:</label>
                  <select
                    value={selected.stage}
                    onChange={e => handleStage(selected.id, e.target.value as InquiryStage)}
                    className="input w-auto text-sm py-1.5">
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-slate-400 text-sm">Status:</label>
                  <select
                    value={selected.status}
                    onChange={e => handleStatus(selected.id, e.target.value as Inquiry['status'])}
                    className="input w-auto text-sm py-1.5">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {selected.stageUpdatedAt && (
                <p className="text-xs text-slate-600">
                  Stage last updated: {new Date(selected.stageUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex items-center justify-between">
              <button onClick={() => { setDeleteId(selected.id); setSelected(null); }} className="btn-danger text-sm">Delete Inquiry</button>
              <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                onClick={() => handleStatus(selected.id, 'REPLIED')}
                className="btn-primary text-sm">Reply via Email ↗</a>
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Inquiry" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete this inquiry. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="btn-danger disabled:opacity-60">
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </>
  );
}
