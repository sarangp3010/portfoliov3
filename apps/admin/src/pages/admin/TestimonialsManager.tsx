import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Testimonial } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast, Toast } from '../../hooks/useToast';
import { useAdminContentMutations, useAdminTestimonialsQuery } from '../../hooks/queries/useContentManagerQueries';

const EMPTY: Partial<Testimonial> = {
  name: '', role: '', company: '', content: '',
  avatarUrl: '', linkedinUrl: '', rating: 5, featured: false, order: 0,
};

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={i <= rating ? 'text-amber-400' : 'text-slate-700'}>★</span>
    ))}
  </div>
);

const Avatar = ({ name, url }: { name: string; url?: string }) => {
  if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center text-sm">{initials}</div>;
};

export default function TestimonialsManager() {
  const { data: items = [], isLoading: loading } = useAdminTestimonialsQuery();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<Testimonial>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const { toast, showToast } = useToast();
  const {
    createTestimonial: createTestimonialMutation,
    updateTestimonial: updateTestimonialMutation,
    deleteTestimonial: deleteTestimonialMutation,
    deleteAllTestimonials: deleteAllTestimonialsMutation,
  } = useAdminContentMutations();

  const openNew  = () => { setForm(EMPTY); setEditing(null); setErr(''); setModal(true); };
  const openEdit = (t: Testimonial) => { setForm({ ...t }); setEditing(t.id); setErr(''); setModal(true); };
  const close    = () => { setModal(false); setForm(EMPTY); setEditing(null); setErr(''); };
  const set      = (k: keyof Testimonial, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.content) { setErr('Name and testimonial content are required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { ...form, order: Number(form.order) || 0, rating: Number(form.rating) || 5 };
      if (editing) await updateTestimonialMutation.mutateAsync({ id: editing, payload });
      else await createTestimonialMutation.mutateAsync(payload);
      close();
      showToast(editing ? 'Updated successfully' : 'Created successfully');
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteTestimonialMutation.mutateAsync(deleteId);
      setDeleteId(null);
      showToast('Deleted successfully');
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await deleteAllTestimonialsMutation.mutateAsync();
      setDeleteAllOpen(false);
      showToast(`Removed ${response.data.count ?? 0} testimonials`);
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Remove all failed', 'error'); }
  };

  return (
    <>
      <Helmet><title>Testimonials Manager — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Testimonials</h1>
            <p className="text-slate-500 mt-1">{items.length} testimonials · {items.filter(t => t.featured).length} featured</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDeleteAllOpen(true)} disabled={items.length === 0} className="btn-danger disabled:opacity-50">Remove All</button>
            <button onClick={openNew} className="btn-primary">+ Add Testimonial</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="space-y-3">
            {items.length === 0 && (
              <div className="col-span-3"><EmptyState icon="💬" title="No testimonials yet" description="Add client testimonials to build trust." /></div>
            )}
            {items.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`card p-5 flex gap-4 ${t.featured ? 'border-accent/30' : ''}`}>
                <Avatar name={t.name} url={t.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{t.name}</span>
                        {t.featured && <span className="badge-purple text-xs">Featured</span>}
                      </div>
                      <p className="text-slate-500 text-xs">{t.role} · {t.company}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(t)} className="btn-ghost px-3 py-1 text-xs">Edit</button>
                      <button onClick={() => setDeleteId(t.id)} className="btn-danger px-3 py-1 text-xs">Delete</button>
                    </div>
                  </div>
                  <Stars rating={t.rating} />
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed line-clamp-2">"{t.content}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={close} title={editing ? 'Edit Testimonial' : 'New Testimonial'} size="lg">
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {err && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Sarah Chen" />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role ?? ''} onChange={e => set('role', e.target.value)} placeholder="Engineering Manager" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company ?? ''} onChange={e => set('company', e.target.value)} placeholder="Tech Corp" />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" className="input" value={form.order ?? 0} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="label">Testimonial Content *</label>
            <textarea className="input" rows={5} value={form.content ?? ''} onChange={e => set('content', e.target.value)} placeholder="Share what they said about your work..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Avatar URL</label>
              <input className="input" value={form.avatarUrl ?? ''} onChange={e => set('avatarUrl', e.target.value)} placeholder="https://... (optional)" />
            </div>
            <div>
              <label className="label">LinkedIn URL</label>
              <input className="input" value={form.linkedinUrl ?? ''} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} type="button" onClick={() => set('rating', star)}
                  className={`text-2xl transition-all ${star <= (form.rating ?? 5) ? 'text-amber-400' : 'text-slate-700 hover:text-amber-400/50'}`}>
                  ★
                </button>
              ))}
              <span className="text-slate-500 text-sm self-center ml-2">{form.rating ?? 5}/5</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <button type="button" onClick={() => set('featured', !form.featured)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.featured ? 'bg-accent' : 'bg-slate-700'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.featured ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-slate-300 text-sm font-medium">Featured Testimonial</p>
              <p className="text-slate-500 text-xs">Shown prominently at the top of the testimonials page</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
            {saving ? <Spinner size="sm" /> : editing ? 'Save Changes' : 'Add Testimonial'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Testimonial" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete this testimonial. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete'}</button>
          </div>
        </div>
      </Modal>
      <Modal open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} title="Remove All Testimonials" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-2">This will permanently delete all testimonials at once.</p>
          <p className="text-red-400/90 text-sm mb-6">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteAllOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleDeleteAll} disabled={deleteAllTestimonialsMutation.isPending} className="btn-danger disabled:opacity-60">{deleteAllTestimonialsMutation.isPending ? 'Removing…' : 'Remove All'}</button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
  );
}
