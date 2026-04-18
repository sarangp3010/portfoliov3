import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { updateTheme } from '../../api';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSetting } from '../../types';

const PRESET_COLORS = [
  { name: 'Indigo',  primary: '#6366f1', accent: '#8b5cf6' },
  { name: 'Violet',  primary: '#7c3aed', accent: '#a78bfa' },
  { name: 'Blue',    primary: '#3b82f6', accent: '#60a5fa' },
  { name: 'Cyan',    primary: '#06b6d4', accent: '#67e8f9' },
  { name: 'Emerald', primary: '#10b981', accent: '#34d399' },
  { name: 'Rose',    primary: '#f43f5e', accent: '#fb7185' },
  { name: 'Orange',  primary: '#f97316', accent: '#fb923c' },
  { name: 'Amber',   primary: '#f59e0b', accent: '#fbbf24' },
];

const FONT_OPTIONS = [
  'Plus Jakarta Sans', 'Inter', 'DM Sans', 'Nunito', 'Poppins', 'Lato',
];

const DISPLAY_FONTS = ['Syne', 'Outfit', 'Cal Sans', 'Space Grotesk', 'Playfair Display'];

const Preview = ({ theme }: { theme: Partial<ThemeSetting> }) => {
  const isLight = theme.mode === 'light';
  const bg   = isLight ? 'bg-slate-100' : 'bg-slate-950';
  const card = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800';
  const text = isLight ? 'text-slate-900' : 'text-white';
  const sub  = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`${bg} rounded-2xl p-5 space-y-4 transition-all duration-300`}>
      <div className={`${card} rounded-xl p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: theme.primaryColor }}>A</div>
          <div>
            <p className={`font-bold text-sm ${text}`} style={{ fontFamily: theme.fontDisplay }}>Portfolio V3</p>
            <p className={`text-xs ${sub}`}>Full-Stack Developer</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['React','TypeScript','Node.js'].map(t => (
            <span key={t} className="text-xs px-2 py-1 rounded-full text-white font-medium" style={{ background: theme.accentColor + '33', color: theme.accentColor }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['💰','Revenue','$12,400'],['👁','Visitors','2,841'],['📬','Inquiries','14']].map(([icon,label,val]) => (
          <div key={label} className={`${card} rounded-xl p-3`}>
            <p className="text-lg">{icon}</p>
            <p className={`text-base font-bold ${text}`} style={{ fontFamily: theme.fontDisplay }}>{val}</p>
            <p className={`text-xs ${sub}`}>{label}</p>
          </div>
        ))}
      </div>
      <button className="w-full py-2 rounded-xl text-white text-sm font-semibold" style={{ background: theme.primaryColor }}>
        Get Started →
      </button>
    </div>
  );
};

export default function ThemeManager() {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<Partial<ThemeSetting>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { setForm({ ...theme }); }, [theme]);

  const set = (k: keyof ThemeSetting, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await updateTheme(form as Record<string,unknown>);
      setTheme(r.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setSaved(false); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Helmet><title>Theme Manager — Admin</title></Helmet>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Theme Manager</h1>
            <p className="text-slate-400 text-sm mt-0.5">Customize your portfolio appearance in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-emerald-400 text-sm">✓ Saved</span>}
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5">
              {saving ? 'Saving…' : 'Apply Changes'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — controls */}
          <div className="space-y-6">
            {/* Mode */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Color Mode</h2>
              <div className="grid grid-cols-2 gap-3">
                {['dark','light'].map(m => (
                  <button key={m} onClick={() => set('mode', m)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.mode === m
                        ? 'bg-accent/15 border-accent/40 text-accent'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>
                    {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color presets */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Color Scheme</h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PRESET_COLORS.map(p => (
                  <button key={p.name} onClick={() => { set('primaryColor', p.primary); set('accentColor', p.accent); }}
                    className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }} />
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Primary</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.primaryColor ?? '#6366f1'} onChange={e => set('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-700 bg-transparent" />
                    <input type="text" value={form.primaryColor ?? ''} onChange={e => set('primaryColor', e.target.value)}
                      className="input text-xs flex-1" placeholder="#6366f1" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Accent</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.accentColor ?? '#8b5cf6'} onChange={e => set('accentColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-700 bg-transparent" />
                    <input type="text" value={form.accentColor ?? ''} onChange={e => set('accentColor', e.target.value)}
                      className="input text-xs flex-1" placeholder="#8b5cf6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Typography</h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Body Font</label>
                  <select className="input" value={form.fontSans ?? ''} onChange={e => set('fontSans', e.target.value)}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Display / Heading Font</label>
                  <select className="input" value={form.fontDisplay ?? ''} onChange={e => set('fontDisplay', e.target.value)}>
                    {DISPLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Style */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Style</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Border Radius</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['sharp','rounded','pill'].map(r => (
                      <button key={r} onClick={() => set('borderRadius', r)}
                        className={`py-2 rounded-xl border text-sm capitalize transition-all ${
                          form.borderRadius === r
                            ? 'bg-accent/15 border-accent/40 text-accent'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Animation Speed</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['none','slow','normal','fast'].map(s => (
                      <button key={s} onClick={() => set('animationSpeed', s)}
                        className={`py-2 rounded-xl border text-xs capitalize transition-all ${
                          form.animationSpeed === s
                            ? 'bg-accent/15 border-accent/40 text-accent'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-2">Custom CSS</h2>
              <p className="text-slate-500 text-xs mb-3">Injected into the page. Use with care.</p>
              <textarea className="input font-mono text-xs leading-relaxed resize-none" rows={5}
                value={form.customCss ?? ''}
                onChange={e => set('customCss', e.target.value)}
                placeholder="/* e.g. .card { border-radius: 0 !important; } */" />
            </div>
          </div>

          {/* Right — live preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Live Preview</h2>
              <motion.div key={JSON.stringify(form)} initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <Preview theme={form} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
