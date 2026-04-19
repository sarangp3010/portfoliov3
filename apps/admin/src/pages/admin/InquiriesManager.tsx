import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Inquiry } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast, Toast } from '../../hooks/useToast';
import { useInquiriesQuery } from '../../hooks/queries/useInquiriesQuery';
import { useUpdateInquiryStatusMutation } from '../../hooks/mutations/useUpdateInquiryStatusMutation';
import { useDeleteInquiryMutation } from '../../hooks/mutations/useDeleteInquiryMutation';

type StatusFilter = 'ALL' | 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';

const STATUS_OPTIONS: Inquiry['status'][] = ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'];

export default function InquiriesManager() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const status = filter === 'ALL' ? undefined : filter;
  const { data, isLoading, isFetching } = useInquiriesQuery(page, status);
  const updateStatusMutation = useUpdateInquiryStatusMutation();
  const deleteMutation = useDeleteInquiryMutation();

  useEffect(() => { setPage(1); }, [filter]);
  useEffect(() => {
    if (!selected) return;
    const next = data?.data.inquiries.find(inquiry => inquiry.id === selected.id) ?? null;
    setSelected(next);
  }, [data, selected?.id]);

  const items = data?.data.inquiries ?? [];
  const total = data?.data.total ?? 0;
  const loading = isLoading;

  const handleStatus = async (id: string, status: Inquiry['status']) => {
    setUpdatingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (e: any) { showToast(e.response?.data?.error ?? 'Failed to update status', 'error'); }
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

  const totalPages = Math.ceil(total / 20);
  const unreadCount = useMemo(() => items.filter(i => i.status === 'UNREAD').length, [items]);
  const deleting = deleteMutation.isPending;

  return (
    <>
      <Helmet><title>Inquiries — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Inquiries</h1>
            <p className="text-slate-500 mt-1">
              {total} total · {unreadCount > 0 && <span className="text-red-400 font-medium">{unreadCount} unread</span>}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-surface-900 rounded-xl w-fit border border-slate-800">
          {(['ALL', 'UNREAD', 'READ', 'REPLIED', 'ARCHIVED'] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {isFetching && (
              <div className="mb-4 text-xs text-slate-500">Refreshing inquiries…</div>
            )}
            <div className="card overflow-hidden mb-4">
              <table className="data-table">
                <thead><tr>
                  <th>From</th><th>Subject</th><th>Service</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <span style={{ fontSize: '32px' }}>📬</span>
                        <p className="font-medium text-white text-sm">No inquiries found</p>
                        <p className="text-xs" style={{ color: '#475569' }}>
                          {filter !== 'ALL' ? 'Try switching to "All" to see everything.' : 'Messages from your contact form will appear here.'}
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
                      <td className="max-w-[200px] truncate text-slate-400">{inq.subject}</td>
                      <td>{inq.serviceType ? <span className="tag text-xs px-2">{inq.serviceType}</span> : <span className="text-slate-600">—</span>}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={inq.status}
                          onChange={e => handleStatus(inq.id, e.target.value as Inquiry['status'])}
                          disabled={updatingId === inq.id}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer bg-transparent ${
                            inq.status === 'UNREAD' ? 'border-red-500/30 text-red-400' :
                            inq.status === 'READ'   ? 'border-blue-500/30 text-blue-400' :
                            inq.status === 'REPLIED'? 'border-emerald-500/30 text-emerald-400' :
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

            {/* Pagination */}
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
            <button onClick={handleDelete} disabled={deleting} className="btn-danger disabled:opacity-60">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
  );
}
