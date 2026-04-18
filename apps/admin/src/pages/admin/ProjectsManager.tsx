import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getProjects, createProject, updateProject, deleteProject } from '../../api';
import { Project } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast, Toast } from '../../hooks/useToast';
import { VersionHistory } from '../../components/admin/VersionHistory';

const EMPTY: Partial<Project> = {
  title: '', description: '', longDesc: '', techStack: [],
  githubUrl: '', liveUrl: '', imageUrl: '', featured: false, order: 0,
};

export default function ProjectsManager() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<Project>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    getProjects().then(r => setItems(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setErr(''); setModal(true); };
  const openEdit = (p: Project) => { setForm({ ...p }); setEditing(p.id); setErr(''); setModal(true); };
  const close    = () => { setModal(false); setForm(EMPTY); setEditing(null); setErr(''); };
  const set      = (k: keyof Project, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description) { setErr('Title and description are required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        techStack: typeof form.techStack === 'string'
          ? (form.techStack as string).split(',').map((t: string) => t.trim()).filter(Boolean)
          : form.techStack,
        order: Number(form.order) || 0,
      };
      if (editing) await updateProject(editing, payload);
      else await createProject(payload);
      close(); load();
      showToast(editing ? 'Updated successfully' : 'Created successfully');
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteProject(deleteId);
      setDeleteId(null);
      load();
      showToast('Deleted successfully');
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <Helmet><title>Projects Manager — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Projects</h1>
            <p className="text-slate-500 mt-1">{items.length} total projects</p>
          </div>
          <button onClick={openNew} className="btn-primary">+ Add Project</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.length === 0 && (
              <div className="col-span-3"><EmptyState icon="🗂" title="No projects yet" description="Add your first portfolio project." /></div>
            )}
            {items.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 flex flex-col gap-3">
                {p.imageUrl && (
                  <div className="h-36 rounded-xl overflow-hidden bg-slate-800">
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-white">{p.title}</h3>
                  {p.featured && <span className="badge-purple shrink-0">Featured</span>}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap gap-1">
                  {p.techStack.slice(0, 4).map(t => <span key={t} className="tag text-xs px-2 py-0.5">{t}</span>)}
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-800">
                  {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-accent transition-colors">GitHub ↗</a>}
                  {p.liveUrl  && <a href={p.liveUrl}  target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-accent transition-colors">Live ↗</a>}
                  <div className="ml-auto flex flex-col items-end gap-1.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="btn-ghost px-3 py-1 text-xs">Edit</button>
                      <button onClick={() => setDeleteId(p.id)} className="btn-danger px-3 py-1 text-xs">Delete</button>
                    </div>
                    <VersionHistory contentType="project" contentId={p.id} onRestored={load} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={close} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {err && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Project Name" />
            </div>
            <div>
              <label className="label">Order</label>
              <input type="number" className="input" value={form.order ?? 0} onChange={e => set('order', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <label className="label">Short Description *</label>
            <input className="input" value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Brief description shown in cards" />
          </div>

          <div>
            <label className="label">Long Description</label>
            <textarea className="input" rows={4} value={form.longDesc ?? ''} onChange={e => set('longDesc', e.target.value)} placeholder="Detailed description (optional)" />
          </div>

          <div>
            <label className="label">Tech Stack <span className="text-slate-500 text-xs font-normal">(comma-separated)</span></label>
            <input className="input" value={Array.isArray(form.techStack) ? form.techStack.join(', ') : (form.techStack ?? '')}
              onChange={e => set('techStack', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="React, Node.js, PostgreSQL" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">GitHub URL</label>
              <input className="input" value={form.githubUrl ?? ''} onChange={e => set('githubUrl', e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="label">Live URL</label>
              <input className="input" value={form.liveUrl ?? ''} onChange={e => set('liveUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="label">Image URL</label>
            <input className="input" value={form.imageUrl ?? ''} onChange={e => set('imageUrl', e.target.value)} placeholder="https://... (preview image)" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <button type="button" onClick={() => set('featured', !form.featured)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.featured ? 'bg-accent' : 'bg-slate-700'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.featured ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-slate-300 text-sm font-medium">Featured Project</p>
              <p className="text-slate-500 text-xs">Shown prominently on the home page</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
            {saving ? <Spinner size="sm" /> : editing ? 'Save Changes' : 'Add Project'}
          </button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Project" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete this project. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete Project'}</button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
  );
}
