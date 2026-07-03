import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlogPost } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useToast, Toast } from '../../hooks/useToast';
import { VersionHistory } from '../../components/admin/VersionHistory';
import { useAdminBlogPostsQuery, useAdminContentMutations } from '../../hooks/queries/useContentManagerQueries';

const EMPTY: Partial<BlogPost> = {
  title: '', slug: '', excerpt: '', content: '', tags: [], coverImage: '',
  published: false, readingTime: 5,
};

const generateSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function BlogManager() {
  const { data: posts = [], isLoading: loading, refetch } = useAdminBlogPostsQuery();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<BlogPost>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState<'all' | 'published' | 'draft'>('all');
  const {
    createPost: createPostMutation,
    updatePost: updatePostMutation,
    deletePost: deletePostMutation,
    deleteAllPosts: deleteAllPostsMutation,
  } = useAdminContentMutations();

  const openNew = () => { setForm(EMPTY); setEditing(null); setErr(''); setModal(true); };
  const openEdit = (p: BlogPost) => { setForm({ ...p, tags: p.tags ?? [] }); setEditing(p.id); setErr(''); setModal(true); };
  const close = () => { setModal(false); setForm(EMPTY); setEditing(null); setErr(''); };

  const set = (k: keyof BlogPost, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (!editing) set('slug', generateSlug(v));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) { setErr('Title and content are required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string'
          ? (form.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
          : form.tags,
      };
      if (editing) await updatePostMutation.mutateAsync({ id: editing, payload });
      else await createPostMutation.mutateAsync(payload);
      close();
      showToast(editing ? 'Updated successfully' : 'Created successfully');
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deletePostMutation.mutateAsync(deleteId);
      setDeleteId(null);
      showToast('Deleted successfully');
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await deleteAllPostsMutation.mutateAsync();
      setDeleteAllOpen(false);
      showToast(`Removed ${response.data.count ?? 0} posts`);
    }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Remove all failed', 'error'); }
  };

  const filtered = posts.filter(p =>
    tab === 'published' ? p.published : tab === 'draft' ? !p.published : true
  );

  return (
    <>
      <Helmet><title>Blog Manager — Admin</title></Helmet>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Blog</h1>
            <p className="text-slate-500 mt-1">{posts.length} total posts</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDeleteAllOpen(true)} disabled={posts.length === 0} className="btn-danger disabled:opacity-50">Remove All</button>
            <button onClick={openNew} className="btn-primary">+ New Post</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-surface-900 rounded-xl w-fit border border-slate-800">
          {(['all', 'published', 'draft'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead><tr>
                <th>Title</th><th>Tags</th><th>Views</th><th>Status</th><th>Date</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-slate-500 py-12">No posts yet.</td></tr>
                )}
                {filtered.map(p => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <div className="font-medium text-white truncate max-w-[280px]">{p.title}</div>
                      <div className="text-slate-600 text-xs font-mono">{p.slug}</div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(p.tags ?? []).slice(0, 3).map(tag => (
                          <span key={tag} className="tag text-xs px-2 py-0.5">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono text-slate-400">{p.views.toLocaleString()}</td>
                    <td>
                      <span className={p.published ? 'badge-green' : 'badge-yellow'}>
                        {p.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs font-mono">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
                        <button onClick={() => setDeleteId(p.id)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                      </div>
                      <div className="mt-1.5 flex justify-end">
                        <VersionHistory contentType="blog" contentId={p.id} onRestored={refetch} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={close} title={editing ? 'Edit Post' : 'New Blog Post'} size="xl">
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {err && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</p>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title ?? ''} onChange={e => handleTitleChange(e.target.value)} placeholder="My Awesome Post" />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input font-mono text-xs" value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} placeholder="my-awesome-post" />
            </div>
          </div>

          <div>
            <label className="label">Excerpt</label>
            <textarea className="input" rows={2} value={form.excerpt ?? ''} onChange={e => set('excerpt', e.target.value)} placeholder="Short description (shown in listing)" />
          </div>

          <div>
            <label className="label">Content * <span className="text-slate-500 text-xs font-normal">(Markdown supported)</span></label>
            <textarea className="input font-mono text-xs leading-relaxed" rows={14} value={form.content ?? ''} onChange={e => set('content', e.target.value)} placeholder="## Introduction&#10;&#10;Write your content here in Markdown..." />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tags <span className="text-slate-500 text-xs font-normal">(comma-separated)</span></label>
              <input className="input" value={Array.isArray(form.tags) ? form.tags.join(', ') : (form.tags ?? '')}
                onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="React, TypeScript, Node.js" />
            </div>
            <div>
              <label className="label">Reading Time (min)</label>
              <input type="number" className="input" value={form.readingTime ?? 5} min={1} max={60}
                onChange={e => set('readingTime', parseInt(e.target.value) || 5)} />
            </div>
          </div>

          <div>
            <label className="label">Cover Image URL</label>
            <input className="input" value={form.coverImage ?? ''} onChange={e => set('coverImage', e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <button type="button" onClick={() => set('published', !form.published)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.published ? 'bg-accent' : 'bg-slate-700'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${form.published ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-slate-300 text-sm font-medium">{form.published ? 'Published' : 'Draft'}</p>
              <p className="text-slate-500 text-xs">{form.published ? 'Visible to all visitors' : 'Only visible to you'}</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
            {saving ? <Spinner size="sm" /> : editing ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Post" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete the post and all its data. This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-ghost">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete Post'}</button>
          </div>
        </div>
      </Modal>
      <Modal open={deleteAllOpen} onClose={() => setDeleteAllOpen(false)} title="Remove All Posts" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-2">This will permanently delete all blog posts at once.</p>
          <p className="text-red-400/90 text-sm mb-6">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteAllOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleDeleteAll} disabled={deleteAllPostsMutation.isPending} className="btn-danger disabled:opacity-60">{deleteAllPostsMutation.isPending ? 'Removing…' : 'Remove All'}</button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} />
    </>
  );
}
