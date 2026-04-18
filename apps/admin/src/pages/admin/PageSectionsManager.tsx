import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  listSectionPages, getAdminSections, createPageSection,
  updatePageSection, deletePageSection, reorderPageSections, togglePageSection,
} from '../../api/index';
import { useToast, Toast } from '../../hooks/useToast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionStyle { primaryColor?: string; bgColor?: string; textColor?: string; gradient?: string; spacing?: string; }
interface SectionAnimation { type?: string; direction?: string; duration?: string; delay?: number; trigger?: string; }
interface PageSection {
  id: string; page: string; key: string; sectionType: string;
  title?: string; subtitle?: string; body?: string;
  ctaText?: string; ctaLink?: string; icon?: string; imageUrl?: string;
  content: Record<string, unknown>; style: SectionStyle; animation: SectionAnimation;
  variant: string; mobileHide: boolean; desktopHide: boolean; isVisible: boolean; order: number;
}

type EditorTab = 'content' | 'style' | 'animation' | 'layout';

const SECTION_TYPES = ['hero','features','stats','projects','testimonials','cta','custom','faq','pricing'] as const;
const ANIM_TYPES    = ['none','fade','slide','scale','blur'] as const;
const DIRECTIONS    = ['up','down','left','right'] as const;
const DURATIONS     = ['fast','normal','slow'] as const;
const TRIGGERS      = ['load','scroll','hover'] as const;
const SPACINGS      = ['compact','normal','spacious'] as const;
const VARIANTS_MAP: Record<string, string[]> = {
  hero:      ['default','centered','split','minimal'],
  cta:       ['default','centered','banner'],
  projects:  ['grid','list','masonry'],
  default:   ['default','centered','minimal'],
};

const PRESET_GRADIENTS = [
  { label: 'None', value: '' },
  { label: 'Indigo →', value: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.04))' },
  { label: 'Dark', value: 'linear-gradient(180deg, rgba(5,7,15,0.95), rgba(10,13,26,0.9))' },
  { label: 'Glow', value: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15), transparent 70%)' },
  { label: 'Warm', value: 'linear-gradient(135deg, rgba(249,115,22,0.06), rgba(239,68,68,0.04))' },
];

// ─── Animation preview helper ─────────────────────────────────────────────────

function AnimPreview({ anim }: { anim: SectionAnimation }) {
  const [key, setKey] = useState(0);
  const dir = anim.direction ?? 'up';
  const durs = { fast: 0.35, normal: 0.6, slow: 0.9 };
  const dur = durs[(anim.duration ?? 'normal') as keyof typeof durs];
  const previewLabel = anim.type === 'none' ? 'No animation' : `${anim.type} ${dir} · ${anim.duration}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        key={key}
        className="w-full h-16 rounded-xl flex items-center justify-center text-xs font-medium"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: '#a5b4fc',
          transition: `all ${dur}s cubic-bezier(0.22, 1, 0.36, 1)`,
          transform: anim.type === 'scale' ? 'scale(1)' : 'translate3d(0,0,0)',
          filter: anim.type === 'blur' ? 'blur(0px)' : 'none',
          opacity: 1,
        }}
      >
        {previewLabel}
      </div>
      <button onClick={() => setKey(k => k + 1)}
        className="text-xs transition-colors" style={{ color: '#475569' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
        ↺ Replay preview
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PageSectionsManager() {
  const { toast, showToast } = useToast();
  const [pages, setPages]           = useState<string[]>(['home', 'services']);
  const [activePage, setActivePage] = useState('home');
  const [sections, setSections]     = useState<PageSection[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<PageSection | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [tab, setTab]               = useState<EditorTab>('content');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form state mirrors the selected section
  const [form, setForm] = useState<Partial<PageSection>>({});

  // ── Load pages list ──────────────────────────────────────────────────────
  useEffect(() => {
    listSectionPages()
      .then(r => {
        const p = r.data.data as string[];
        setPages([...new Set([...p, 'home', 'services'])]);
      })
      .catch(() => {});
  }, []);

  // ── Load sections for active page ────────────────────────────────────────
  const loadSections = useCallback(() => {
    setLoading(true);
    getAdminSections(activePage)
      .then(r => setSections(r.data.data as PageSection[]))
      .catch(() => showToast('Failed to load sections', 'error'))
      .finally(() => setLoading(false));
  }, [activePage]);

  useEffect(() => { setSelected(null); setIsNew(false); loadSections(); }, [loadSections]);

  // ── Open section for editing ─────────────────────────────────────────────
  const openSection = (s: PageSection) => {
    setSelected(s);
    setIsNew(false);
    setForm({ ...s });
    setTab('content');
    setConfirmDelete(false);
  };

  const openNew = () => {
    const newSection = {
      page: activePage, key: '', sectionType: 'custom', title: '', subtitle: '',
      body: '', ctaText: '', ctaLink: '', icon: '', imageUrl: '',
      content: {}, style: { spacing: 'normal' }, animation: { type: 'fade', direction: 'up', duration: 'normal', delay: 0, trigger: 'scroll' },
      variant: 'default', mobileHide: false, desktopHide: false, isVisible: true, order: sections.length,
    } as Partial<PageSection>;
    setSelected(null);
    setIsNew(true);
    setForm(newSection);
    setTab('content');
  };

  const setF = (path: string, value: unknown) => {
    setForm(prev => {
      const next = { ...prev };
      if (path.includes('.')) {
        const [top, sub] = path.split('.');
        next[top as keyof PageSection] = { ...(prev[top as keyof PageSection] as object ?? {}), [sub]: value } as never;
      } else {
        (next as Record<string, unknown>)[path] = value;
      }
      return next;
    });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.key?.trim()) { showToast('Section key is required', 'error'); return; }
    if (!form.sectionType)  { showToast('Section type is required', 'error'); return; }
    setSaving(true);
    try {
      if (isNew) {
        const r = await createPageSection({ ...form, page: activePage });
        setSections(prev => [...prev, r.data.data].sort((a, b) => a.order - b.order));
        setSelected(r.data.data);
        setIsNew(false);
        showToast('Section created');
      } else if (selected) {
        const r = await updatePageSection(selected.id, form);
        setSections(prev => prev.map(s => s.id === selected.id ? r.data.data : s));
        setSelected(r.data.data);
        showToast('Saved');
      }
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  // ── Toggle visibility ────────────────────────────────────────────────────
  const handleToggle = async (s: PageSection) => {
    try {
      await togglePageSection(s.id);
      setSections(prev => prev.map(x => x.id === s.id ? { ...x, isVisible: !x.isVisible } : x));
      if (selected?.id === s.id) setForm(f => ({ ...f, isVisible: !f.isVisible }));
      showToast(s.isVisible ? 'Section hidden' : 'Section visible');
    } catch { showToast('Toggle failed', 'error'); }
  };

  // ── Reorder ──────────────────────────────────────────────────────────────
  const move = async (id: string, dir: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === sections.length - 1)) return;
    const next = [...sections];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const reordered = next.map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    try {
      await reorderPageSections(reordered.map(s => ({ id: s.id, order: s.order })));
    } catch { loadSections(); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deletePageSection(selected.id);
      setSections(prev => prev.filter(s => s.id !== selected.id));
      setSelected(null); setIsNew(false); setConfirmDelete(false);
      showToast('Section deleted');
    } catch (e: any) {
      showToast(e.response?.data?.error ?? 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const variants = VARIANTS_MAP[form.sectionType ?? 'default'] ?? VARIANTS_MAP.default;
  const hasChanges = selected && JSON.stringify(form) !== JSON.stringify(selected);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-2xl text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Page Sections
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Control content, layout, animations and visibility per page — no code required.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm px-4 py-2">+ Add Section</button>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
        {pages.map(p => (
          <button key={p} onClick={() => setActivePage(p)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              background: activePage === p ? 'rgba(99,102,241,0.2)' : 'transparent',
              color:      activePage === p ? '#a5b4fc' : '#64748b',
            }}>
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-5" style={{ minHeight: '72vh' }}>

        {/* ── Left: section list ── */}
        <div className="w-60 flex-shrink-0 space-y-1.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))
          ) : sections.length === 0 ? (
            <div className="card text-center py-8">
              <p style={{ fontSize: '28px' }}>📄</p>
              <p className="text-sm font-medium text-white mt-2">No sections</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>Add a section to get started</p>
            </div>
          ) : (
            sections.map((s, idx) => (
              <motion.div key={s.id} layout
                className="group rounded-xl overflow-hidden transition-all"
                style={{
                  background: selected?.id === s.id ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.04)',
                  border: `1px solid ${selected?.id === s.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.08)'}`,
                  opacity: s.isVisible ? 1 : 0.5,
                }}>
                <button className="w-full text-left px-3 py-2.5" onClick={() => openSection(s)}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.icon || '📄'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{s.title || s.key}</p>
                      <p className="text-xs font-mono truncate" style={{ color: '#334155' }}>{s.key}</p>
                    </div>
                  </div>
                </button>
                {/* Controls */}
                <div className="flex items-center justify-between px-3 pb-2 gap-1">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(s.id, 'up')} disabled={idx === 0}
                      className="p-1 rounded disabled:opacity-30 transition-colors"
                      style={{ color: '#475569' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>↑</button>
                    <button onClick={() => move(s.id, 'down')} disabled={idx === sections.length - 1}
                      className="p-1 rounded disabled:opacity-30 transition-colors"
                      style={{ color: '#475569' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>↓</button>
                  </div>
                  <button onClick={() => handleToggle(s)}
                    className="text-xs px-2 py-0.5 rounded-full transition-all"
                    style={{
                      background: s.isVisible ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)',
                      color:      s.isVisible ? '#4ade80' : '#64748b',
                      border:     `1px solid ${s.isVisible ? 'rgba(74,222,128,0.2)' : 'rgba(100,116,139,0.2)'}`,
                    }}>
                    {s.isVisible ? 'On' : 'Off'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Right: editor ── */}
        <div className="flex-1 min-w-0">
          {!selected && !isNew ? (
            <div className="h-full flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.08)' }}>
              <div className="text-center">
                <p style={{ fontSize: '40px' }}>🎨</p>
                <p className="font-semibold text-white mt-3 mb-1">Select a section to edit</p>
                <p className="text-sm" style={{ color: '#475569' }}>
                  Control content, style, animations, and layout — no code needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Editor header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  {isNew ? (
                    <div className="flex gap-3">
                      <div>
                        <label className="label text-xs">Key *</label>
                        <input className="input text-xs font-mono w-36"
                          placeholder="e.g. hero"
                          value={form.key ?? ''}
                          onChange={e => setF('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))} />
                      </div>
                      <div>
                        <label className="label text-xs">Type *</label>
                        <select className="input text-xs w-36" value={form.sectionType ?? 'custom'}
                          onChange={e => setF('sectionType', e.target.value)}>
                          {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
                          {form.title || form.key || 'Section'}
                        </span>
                        {hasChanges && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                            unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#334155' }}>
                        {form.key} · {form.sectionType}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isNew && selected && !confirmDelete && (
                    <button onClick={() => setConfirmDelete(true)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
                      Delete
                    </button>
                  )}
                  {confirmDelete && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: '#fca5a5' }}>Sure?</span>
                      <button onClick={handleDelete} disabled={deleting}
                        className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                        style={{ background: '#ef4444', color: '#fff' }}>
                        {deleting ? '…' : 'Yes'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                    {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-5 pt-3" style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                {(['content', 'style', 'animation', 'layout'] as EditorTab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="px-4 py-2.5 text-sm font-medium capitalize transition-all"
                    style={{
                      color: tab === t ? '#a5b4fc' : '#475569',
                      borderBottom: `2px solid ${tab === t ? '#6366f1' : 'transparent'}`,
                      marginBottom: '-1px',
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5 overflow-y-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin' }}>

                {/* ── CONTENT TAB ── */}
                {tab === 'content' && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Title</label>
                        <input className="input" value={form.title ?? ''} placeholder="Section heading"
                          onChange={e => setF('title', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Icon / Emoji</label>
                        <input className="input" value={form.icon ?? ''} placeholder="⚡"
                          onChange={e => setF('icon', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Subtitle</label>
                      <input className="input" value={form.subtitle ?? ''} placeholder="Supporting text"
                        onChange={e => setF('subtitle', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Body Text</label>
                      <textarea className="input resize-none" rows={3} value={form.body ?? ''}
                        placeholder="Longer description or paragraph..."
                        onChange={e => setF('body', e.target.value)} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">CTA Button Text</label>
                        <input className="input" value={form.ctaText ?? ''} placeholder="Get Started"
                          onChange={e => setF('ctaText', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">CTA Link</label>
                        <input className="input" value={form.ctaLink ?? ''} placeholder="/services"
                          onChange={e => setF('ctaLink', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Image URL</label>
                      <input className="input" value={form.imageUrl ?? ''} placeholder="https://..."
                        onChange={e => setF('imageUrl', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
                      <button type="button" onClick={() => setF('isVisible', !form.isVisible)}
                        className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors"
                        style={{ background: form.isVisible ? '#6366f1' : '#334155' }}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow mt-0.5 transition-transform ${form.isVisible ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                      </button>
                      <div>
                        <p className="text-white text-sm font-medium">Visible on public site</p>
                        <p className="text-xs" style={{ color: '#475569' }}>Toggle to show or hide this section</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STYLE TAB ── */}
                {tab === 'style' && (
                  <div className="space-y-5">
                    <div>
                      <label className="label">Background Gradient</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {PRESET_GRADIENTS.map(g => (
                          <button key={g.label} onClick={() => setF('style.gradient', g.value)}
                            className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: g.value || 'rgba(99,102,241,0.05)',
                              border: form.style?.gradient === g.value
                                ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(99,102,241,0.12)',
                              color: '#94a3b8',
                            }}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Background Color</label>
                        <div className="flex gap-2">
                          <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                            value={form.style?.bgColor ?? '#030508'}
                            onChange={e => setF('style.bgColor', e.target.value)} />
                          <input className="input flex-1 font-mono text-xs"
                            value={form.style?.bgColor ?? ''} placeholder="transparent"
                            onChange={e => setF('style.bgColor', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="label">Text Color</label>
                        <div className="flex gap-2">
                          <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                            value={form.style?.textColor ?? '#e2e8f0'}
                            onChange={e => setF('style.textColor', e.target.value)} />
                          <input className="input flex-1 font-mono text-xs"
                            value={form.style?.textColor ?? ''} placeholder="inherit"
                            onChange={e => setF('style.textColor', e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="label">Accent Color</label>
                        <div className="flex gap-2">
                          <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                            value={form.style?.primaryColor ?? '#6366f1'}
                            onChange={e => setF('style.primaryColor', e.target.value)} />
                          <input className="input flex-1 font-mono text-xs"
                            value={form.style?.primaryColor ?? ''} placeholder="#6366f1"
                            onChange={e => setF('style.primaryColor', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="label">Spacing</label>
                      <div className="flex gap-2">
                        {SPACINGS.map(s => (
                          <button key={s} onClick={() => setF('style.spacing', s)}
                            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                            style={{
                              background: form.style?.spacing === s ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                              border: `1px solid ${form.style?.spacing === s ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                              color: form.style?.spacing === s ? '#a5b4fc' : '#64748b',
                            }}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ANIMATION TAB ── */}
                {tab === 'animation' && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <AnimPreview anim={form.animation ?? {}} />
                    </div>
                    <div>
                      <label className="label">Animation Type</label>
                      <div className="flex flex-wrap gap-2">
                        {ANIM_TYPES.map(t => (
                          <button key={t} onClick={() => setF('animation.type', t)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                            style={{
                              background: form.animation?.type === t ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                              border: `1px solid ${form.animation?.type === t ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                              color: form.animation?.type === t ? '#a5b4fc' : '#64748b',
                            }}>{t}</button>
                        ))}
                      </div>
                    </div>
                    {form.animation?.type !== 'none' && (
                      <>
                        <div>
                          <label className="label">Direction</label>
                          <div className="flex gap-2">
                            {DIRECTIONS.map(d => (
                              <button key={d} onClick={() => setF('animation.direction', d)}
                                className="flex-1 py-1.5 rounded-lg text-sm capitalize transition-all"
                                style={{
                                  background: form.animation?.direction === d ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                                  border: `1px solid ${form.animation?.direction === d ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                                  color: form.animation?.direction === d ? '#a5b4fc' : '#64748b',
                                }}>{d}</button>
                            ))}
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Duration</label>
                            <div className="flex gap-2">
                              {DURATIONS.map(d => (
                                <button key={d} onClick={() => setF('animation.duration', d)}
                                  className="flex-1 py-1.5 rounded-lg text-sm capitalize transition-all"
                                  style={{
                                    background: form.animation?.duration === d ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                                    border: `1px solid ${form.animation?.duration === d ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                                    color: form.animation?.duration === d ? '#a5b4fc' : '#64748b',
                                  }}>{d}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="label">Delay (seconds)</label>
                            <input type="number" className="input" min="0" max="2" step="0.1"
                              value={form.animation?.delay ?? 0}
                              onChange={e => setF('animation.delay', parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>
                        <div>
                          <label className="label">Trigger</label>
                          <div className="flex gap-2">
                            {TRIGGERS.map(t => (
                              <button key={t} onClick={() => setF('animation.trigger', t)}
                                className="flex-1 py-1.5 rounded-lg text-sm capitalize transition-all"
                                style={{
                                  background: form.animation?.trigger === t ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                                  border: `1px solid ${form.animation?.trigger === t ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                                  color: form.animation?.trigger === t ? '#a5b4fc' : '#64748b',
                                }}>{t}</button>
                            ))}
                          </div>
                          <p className="text-xs mt-1.5" style={{ color: '#334155' }}>
                            <strong style={{ color: '#475569' }}>load</strong> — animates on page load ·&nbsp;
                            <strong style={{ color: '#475569' }}>scroll</strong> — animates when scrolled into view
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── LAYOUT TAB ── */}
                {tab === 'layout' && (
                  <div className="space-y-5">
                    <div>
                      <label className="label">Layout Variant</label>
                      <p className="text-xs mb-3" style={{ color: '#475569' }}>
                        Controls how the section renders on the frontend.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {variants.map(v => (
                          <button key={v} onClick={() => setF('variant', v)}
                            className="py-3 rounded-xl text-sm font-medium capitalize transition-all text-center"
                            style={{
                              background: form.variant === v ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
                              border: `1px solid ${form.variant === v ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.1)'}`,
                              color: form.variant === v ? '#a5b4fc' : '#64748b',
                            }}>
                            <span className="block text-lg mb-1">
                              {v === 'default' ? '▣' : v === 'centered' ? '⊡' : v === 'split' ? '⬛' : v === 'grid' ? '⊞' : '▤'}
                            </span>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Device Visibility</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={!form.mobileHide}
                            onChange={e => setF('mobileHide', !e.target.checked)}
                            className="w-4 h-4 rounded accent-indigo-500" />
                          <span className="text-sm text-white">Show on mobile</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={!form.desktopHide}
                            onChange={e => setF('desktopHide', !e.target.checked)}
                            className="w-4 h-4 rounded accent-indigo-500" />
                          <span className="text-sm text-white">Show on desktop</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
