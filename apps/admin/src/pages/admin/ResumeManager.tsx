import { useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getAllResumes, uploadResume, activateResume, deleteResume } from '../../api';
import { Resume } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { useToast, Toast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';

export default function ResumeManager() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [version, setVersion] = useState(new Date().getFullYear().toString());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAllResumes().then(r => setResumes(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setUploadErr('Only PDF files are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadErr('File size must be under 10MB'); return; }

    setUploading(true); setUploadErr(''); setUploadSuccess('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('version', version);
      await uploadResume(fd);
      setUploadSuccess(`"${file.name}" uploaded successfully!`);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e: any) { setUploadErr(e.response?.data?.error ?? 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleActivate = async (id: string) => {
    try { await activateResume(id); load(); showToast('Resume set as active'); }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Failed to activate', 'error'); }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteResume(deleteId); setDeleteId(null); load(); showToast('Resume deleted'); }
    catch (e: any) { showToast(e.response?.data?.error ?? 'Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  const active = resumes.find(r => r.isActive);

  return (
    <>
      <Helmet><title>Resume Manager — Admin</title></Helmet>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Resume</h1>
          <p className="text-slate-500 mt-1">Upload and manage resume versions</p>
        </div>

        {/* Current Active */}
        {active && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-6 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">📄</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{active.fileName}</p>
                  <span className="badge-green">Active</span>
                </div>
                <p className="text-slate-500 text-xs">Version {active.version} · Uploaded {new Date(active.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                <span className="text-white font-mono text-lg">{active.downloadCount}</span> downloads
              </span>
              <a href="/api/resume/download" target="_blank" rel="noopener noreferrer"
                className="text-accent hover:underline text-xs">Preview/Download ↗</a>
            </div>
          </motion.div>
        )}

        {/* Upload Zone */}
        <div className="card p-6 mb-8">
          <h2 className="font-display font-bold text-white mb-4">Upload New Resume</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-1">
              <label className="label">Version Label</label>
              <input className="input" value={version} onChange={e => setVersion(e.target.value)} placeholder="2025.1" />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <div className="w-full">
                <label className="label">PDF File</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-accent/50 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-accent/5 group">
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2"><Spinner size="sm" /><span className="text-slate-400">Uploading...</span></div>
                  ) : (
                    <>
                      <p className="text-2xl mb-2">📤</p>
                      <p className="text-slate-400 text-sm group-hover:text-white transition-colors">Click to upload PDF</p>
                      <p className="text-slate-600 text-xs mt-1">Max 10MB · PDF only</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          {uploadErr     && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{uploadErr}</p>}
          {uploadSuccess && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">✓ {uploadSuccess}</p>}
        </div>

        {/* History */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="font-display font-bold text-white">Version History</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span style={{ fontSize: '40px' }}>📄</span>
              <p className="font-medium text-white">No resumes uploaded yet</p>
              <p className="text-sm" style={{ color: '#475569' }}>Upload a PDF to make your resume available for download.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr>
                <th>File</th><th>Version</th><th>Downloads</th><th>Uploaded</th><th>Status</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {resumes.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">📄</span>
                        <span className="text-white font-medium truncate max-w-[200px]">{r.fileName}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{r.version}</td>
                    <td className="text-slate-400">{r.downloadCount.toLocaleString()}</td>
                    <td className="text-xs font-mono text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      {r.isActive
                        ? <span className="badge-green">Active</span>
                        : <span className="badge text-slate-600 border border-slate-700">Inactive</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {!r.isActive && (
                          <button onClick={() => handleActivate(r.id)} className="btn-ghost px-3 py-1 text-xs">Set Active</button>
                        )}
                        <button onClick={() => setDeleteId(r.id)} disabled={r.isActive} className="btn-danger px-3 py-1 text-xs disabled:opacity-40 disabled:cursor-not-allowed">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-xs leading-relaxed">
          <strong className="text-slate-400">Download URL:</strong> <code className="font-mono text-accent">/api/resume/download</code> — share this link with visitors. The active resume will always be served at this URL.
        </div>
      </div>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Resume" size="sm">
        <div className="p-6">
          <p className="text-slate-400 mb-6">This will permanently delete this resume file. This action cannot be undone.</p>
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
