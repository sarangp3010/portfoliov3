import { useState, useEffect } from 'react';
import { getVersionHistory, getVersionSnapshot, restoreVersion } from '../../api/index';
import type { ContentVersionMeta, ContentVersionFull } from '../../types/index';

interface Props {
  contentType: 'blog' | 'project' | 'service' | 'profile';
  contentId: string;
  onRestored?: () => void;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString();

export const VersionHistory = ({ contentType, contentId, onRestored }: Props) => {
  const [versions, setVersions] = useState<ContentVersionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ContentVersionFull | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [restoreErr, setRestoreErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getVersionHistory(contentType, contentId)
      .then(r => setVersions(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contentType, contentId, open]);

  const handlePreview = async (versionId: string) => {
    const r = await getVersionSnapshot(versionId);
    setPreview(r.data.data ?? null);
  };

  const handleRestore = async (versionId: string) => {
    setRestoreErr('');
    if (!window.confirm('Restore this version? Current content will be overwritten.')) return;
    setRestoring(versionId);
    try {
      await restoreVersion(versionId);
      setOpen(false);
      setPreview(null);
      onRestored?.();
    } catch { setRestoreErr('Restore failed. Please try again.'); }
    setRestoring(null);
  };

  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors">
        🕑 Version History
        {versions.length > 0 && !open && <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full">{versions.length}</span>}
      </button>

      {open && (
        <div className="mt-3 border border-slate-700 rounded-xl overflow-hidden" style={{ backgroundColor: '#03050f' }}>
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-white text-sm font-medium">Version History</h4>
            <button onClick={() => { setOpen(false); setPreview(null); setRestoreErr(''); }} className="text-slate-500 hover:text-white text-xs">Close</button>
          </div>

          {restoreErr && (
            <div className="px-4 py-2 text-xs" style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5' }}>
              {restoreErr}
            </div>
          )}
          {loading ? (
            <p className="px-4 py-6 text-slate-500 text-sm italic">Loading…</p>
          ) : versions.length === 0 ? (
            <p className="px-4 py-6 text-slate-500 text-sm italic">No versions saved yet. Versions are saved when you edit and update content.</p>
          ) : (
            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {versions.map(v => (
                <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className="text-slate-200 text-sm">v{v.version} — {v.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{fmtDate(v.createdAt)}{v.changedBy ? ` · by ${v.changedBy}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handlePreview(v.id)} className="text-slate-400 hover:text-white text-xs transition-colors">Preview</button>
                    <button onClick={() => handleRestore(v.id)} disabled={restoring === v.id} className="text-accent hover:text-indigo-300 text-xs transition-colors disabled:opacity-50">
                      {restoring === v.id ? 'Restoring…' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Snapshot Preview */}
          {preview && (
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-300 text-xs font-medium">Snapshot — v{preview.version}</p>
                <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-white text-xs">×</button>
              </div>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 overflow-auto max-h-56 font-mono">
                {JSON.stringify(preview.snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
