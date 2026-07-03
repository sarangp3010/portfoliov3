import { useState } from 'react';
import type { FeatureFlag } from '../../types/index';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { useAdminFeatureFlagMutations, useAdminFeatureFlagsQuery } from '../../hooks/queries/useAdminToolingQueries';

const CATEGORY_ICONS: Record<string, string> = {
  content: '📝', analytics: '📊', developer: '🔧', performance: '⚡', system: '🖥', general: '⚙️',
};

const CATEGORY_ORDER = ['content', 'analytics', 'performance', 'developer', 'system', 'general'];

const Toggle = ({ enabled, onChange, loading }: { enabled: boolean; onChange: (v: boolean) => void; loading?: boolean }) => (
  <button
    onClick={() => onChange(!enabled)}
    disabled={loading}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-accent ${enabled ? 'bg-accent' : 'bg-slate-700'} ${loading ? 'opacity-50' : ''}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function FeatureFlags() {
  const [saving, setSaving] = useState<string | null>(null);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { data: flags = [], isLoading: loading, refetch } = useAdminFeatureFlagsQuery();
  const { toggleFeatureFlag, patchFeatureFlag } = useAdminFeatureFlagMutations();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleToggle = async (key: string, enabled: boolean) => {
    setSaving(key);
    try {
      await toggleFeatureFlag.mutateAsync({ key, enabled });
      await refetch();
      showToast(`${key} ${enabled ? 'enabled' : 'disabled'}`);
    } catch { showToast('Failed to update flag'); }
    setSaving(null);
  };

  const handleSaveEdit = async () => {
    if (!editFlag) return;
    setSaving(editFlag.key);
    try {
      await patchFeatureFlag.mutateAsync({
        key: editFlag.key,
        payload: { name: editFlag.name, description: editFlag.description, category: editFlag.category },
      });
      await refetch();
      setEditFlag(null);
      showToast('Flag updated');
    } catch { showToast('Failed to save'); }
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const catFlags = flags.filter(f => f.category === cat);
    if (catFlags.length) acc[cat] = catFlags;
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  // add any uncategorised
  const allCats = [...new Set(flags.map(f => f.category))];
  allCats.forEach(cat => { if (!grouped[cat]) grouped[cat] = flags.filter(f => f.category === cat); });

  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 text-white text-sm px-4 py-3 rounded-lg shadow-xl z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
          <p className="text-slate-400 text-sm mt-0.5">Control platform features dynamically — {enabledCount}/{flags.length} enabled</p>
        </div>
      </div>

      {/* Flag Groups */}
      {Object.entries(grouped).map(([category, catFlags]) => (
        <section key={category}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>{CATEGORY_ICONS[category] ?? '⚙️'}</span>
            {category}
          </h2>
          <div className="admin-card divide-y divide-slate-800">
            {catFlags.map(flag => (
              <div key={flag.key} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{flag.name}</p>
                    <code className="text-slate-500 text-[11px] font-mono bg-slate-800 px-1.5 py-0.5 rounded">{flag.key}</code>
                  </div>
                  {flag.description && <p className="text-slate-400 text-xs mt-0.5">{flag.description}</p>}
                  {flag.updatedBy && <p className="text-slate-600 text-[11px] mt-0.5">Updated by {flag.updatedBy}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => setEditFlag({ ...flag })} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Edit</button>
                  <Toggle enabled={flag.enabled} loading={saving === flag.key} onChange={v => handleToggle(flag.key, v)} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Edit Modal */}
      <Modal open={!!editFlag} onClose={() => setEditFlag(null)} title={editFlag ? `Edit Flag — ${editFlag.key}` : ''} size="sm">
        {editFlag && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Display Name</label>
              <input className="input w-full" value={editFlag.name} onChange={e => setEditFlag({ ...editFlag, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Description</label>
              <textarea className="input w-full h-20 resize-none" value={editFlag.description ?? ''} onChange={e => setEditFlag({ ...editFlag, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#64748b' }}>Category</label>
              <select className="input w-full" value={editFlag.category} onChange={e => setEditFlag({ ...editFlag, category: e.target.value })}>
                {CATEGORY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditFlag(null)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving === editFlag.key} className="btn-primary text-sm px-4 py-2">
                {saving === editFlag.key ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
