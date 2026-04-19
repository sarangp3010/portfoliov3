import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getServices, createService, updateService, deleteService, deleteAllServices } from '../../api';
import { Service } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast, Toast } from '../../hooks/useToast';

const EMPTY: Partial<Service> = {
  title: '', description: '', features: [], price: '', priceNote: '',
  tier: '', popular: false, ctaLabel: 'Get Started', order: 0,
};

export default function ServicesManager() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<Service>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { toast, showToast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    getServices().then(r => setItems(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setErr(''); setModal(true); };
  const openEdit = (s: Service) => { setForm({ ...s }); setEditing(s.id); setErr(''); setModal(true); };
  const close    = () => { setModal(false); setForm(EMPTY); setEditing(null); setErr(''); };
  const set      = (k: keyof Service, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.price) { setErr('Title and price are required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        features: typeof form.features === 'string'
          ? (form.features as string).split('\n').map((f: string) => f.trim()).filter(Boolean)
          : form.features,
        order: Number(form.order) || 0,
      };
      if (editing) await updateService(editing, payload);
      else await createService(payload);
      close(); load();
      showToast(editing ? 'Updated successfully' : 'Created successfully');
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteService(deleteId);
      setDeleteId(null);
      load();
      showToast('Deleted successfully');
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);
      const response = await deleteAllServices();
      setDeleteAllOpen(false);
      load();
      showToast(`Removed ${response.data.count ?? 0} services`);
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Remove all failed', 'error'); }
    finally { setDeletingAll(false); }
  };

  return (
    <>
      <Helmet><title>Services Manager — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Services</h1>
            <p className="text-slate-500 mt-1">Manage your service tiers and pricing</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDeleteAllOpen(true)} disabled={items.length === 0} className="btn-danger disabled:opacity-50">Remove All</button>
            <button onClick={openNew} className="btn-primary">+ Add Service</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.length === 0 && (
              <div className="sm:col-span-3 text-center py-16 text-slate-500">No services yet. Add your first service tier.</div>
            )}
            {items.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className={`card p-5 flex flex-col gap-4 relative ${s.popular ? 'border-accent/40 shadow-lg shadow-accent/5' : ''}`}>
                {s.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-purple px-3 py-1 shadow-lg">⭐ Popular</span>
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-1">{s.tier}</p>
                  <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">{s.description}</p>
                </div>
                <div>
                  <span className="font-display text-3xl font-bold text-white">{s.price}</span>
                  {s.priceNote && <span className="text-slate-500 text-sm ml-2">{s.priceNote}</span>}
                </div>
                <ul className="space-y-2 flex-1">
                  {(s.features ?? []).slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
                      <span className="text-accent mt-0.5 shrink-0">✓</span> {f}
                    </li>
                  ))}
                  {(s.features?.length ?? 0) > 5 && (
                    <li className="text-slate-600 text-xs">+{(s.features?.length ?? 0) - 5} more features</li>
                  )}
                </ul>
                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button onClick={() => openEdit(s)} className="btn-ghost px-3 py-1.5 text-xs flex-1">Edit</button>
                  <button onClick={() => setDeleteId(s.id)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={close} title={editing ? 'Edit Service' : 'New Service Tier'} size="lg">
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {err && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Professional" />
            </div>
            <div>
              <label className="label">Tier ID</label>
              <input className="input font-mono text-xs" value={form.tier ?? ''} onChange={e => set('tier', e.target.value.toLowerCase())} placeholder="professional" />
            </div>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea className="input" rows={2} value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="What this tier includes..." />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Price *</label>
              <input className="input" value={form.price ?? ''} onChange={e => set('price', e.target.value)} placeholder="$4,500 or Custom" />
            </div>
            <div>
              <label className="label">Price Note</label>
              <input className="input" value={form.priceNote ?? ''} onChange={e => set('priceNote', e.target.value)} placeholder="one-time, /month" />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" className="input" value={form.order ?? 0} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="label">Features <span className="text-slate-500 text-xs font-normal">(one per line)</span></label>
            <textarea className="input font-mono text-xs leading-relaxed" rows={8}
              value={Array.isArray(form.features) ? form.features.join('\n') : (form.features ?? '')}
              onChange={e => set('features', e.target.value.split('\n').map(f => f.trim()).filter(Boolean))}
              placeholder="Responsive design&#10;Contact form&#10;SEO optimization&#10;2 revisions" />
          </div>

          <div>
            <label className="label">CTA Button Label</label>
            <input className="input" value={form.ctaLabel ?? 'Get Started'} onChange={e => set('ctaLabel', e.target.value)} placeholder="Get Started" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <button type="button" onClick={() => set('popular', !form.popular)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.popular ? 'bg-accent' : 'bg-slate-700'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.popular ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-slate-300 text-sm font-medium">Mark as Popular</p>
              <p className="text-slate-500 text-xs">Highlights this tier with an accent border and badge</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
            {saving ? <Spinner size="sm" /> : editing ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Service" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete this service tier. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete Service'}</button>
          </div>
        </div>
      </Modal>
      <Modal open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} title="Remove All Services" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-2">This will permanently delete all services at once.</p>
          <p className="text-red-400/90 text-sm mb-6">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteAllOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleDeleteAll} disabled={deletingAll} className="btn-danger disabled:opacity-60">{deletingAll ? 'Removing…' : 'Remove All'}</button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
  );
}
