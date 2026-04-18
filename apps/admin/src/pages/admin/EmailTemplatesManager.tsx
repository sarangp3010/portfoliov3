import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getEmailTemplates, createEmailTemplate, updateEmailTemplate,
  deleteEmailTemplate, resetEmailTemplate, previewEmailTemplate, sendTestEmail,
} from '../../api/index';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  isSystem: boolean;
  updatedAt: string;
}

type Tab = 'subject' | 'html' | 'preview';

const VARIABLE_DOCS: Record<string, string> = {
  name: 'Recipient full name',
  email: 'Recipient email address',
  subject: 'Email subject / inquiry subject',
  message: 'Full message body',
  preview: 'Truncated message preview',
  service: 'Service or plan name',
  amount: 'Payment amount (formatted)',
  date: 'Date string',
  receipt_id: 'Payment receipt ID',
  portal_url: 'Customer portal base URL',
  reply: 'Admin reply text',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractVars(text: string): string[] {
  return [...new Set((text.match(/\{\{(\w+)\}\}/g) ?? []).map(v => v.slice(2, -2)))];
}

function Badge({ label, color = 'indigo' }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    indigo: 'rgba(99,102,241,0.12)',
    cyan:   'rgba(6,182,212,0.12)',
    amber:  'rgba(245,158,11,0.12)',
  };
  const textColors: Record<string, string> = {
    indigo: '#a5b4fc',
    cyan:   '#67e8f9',
    amber:  '#fcd34d',
  };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-mono"
      style={{ background: colors[color], color: textColors[color], border: `1px solid ${textColors[color]}22` }}>
      {`{{${label}}}`}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailTemplatesManager() {
  const [templates, setTemplates]     = useState<EmailTemplate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<EmailTemplate | null>(null);
  const [isNew, setIsNew]             = useState(false);
  const [tab, setTab]                 = useState<Tab>('subject');
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [resetting, setResetting]     = useState(false);
  const [previewing, setPreviewing]   = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testTo, setTestTo]           = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testMsg, setTestMsg]         = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast]             = useState('');
  const [form, setForm]               = useState({ key: '', name: '', subject: '', html: '', text: '' });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await getEmailTemplates();
      setTemplates(r.data.data);
    } catch { showToast('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openTemplate = (tpl: EmailTemplate) => {
    setSelected(tpl);
    setIsNew(false);
    setForm({ key: tpl.key, name: tpl.name, subject: tpl.subject, html: tpl.html, text: tpl.text ?? '' });
    setTab('subject');
    setPreviewHtml('');
    setTestMsg('');
    setConfirmDelete(false);
  };

  const openNew = () => {
    setSelected(null);
    setIsNew(true);
    setForm({ key: '', name: '', subject: '', html: '', text: '' });
    setTab('subject');
    setPreviewHtml('');
    setTestMsg('');
    setConfirmDelete(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.html) { showToast('Name, subject, and HTML are required'); return; }
    setSaving(true);
    try {
      if (isNew) {
        if (!form.key) { showToast('Template key is required'); setSaving(false); return; }
        const r = await createEmailTemplate(form);
        setTemplates(prev => [...prev, r.data.data].sort((a, b) => a.key.localeCompare(b.key)));
        setSelected(r.data.data);
        setIsNew(false);
        showToast('Template created');
      } else if (selected) {
        const r = await updateEmailTemplate(selected.id, { name: form.name, subject: form.subject, html: form.html, text: form.text });
        setTemplates(prev => prev.map(t => t.id === selected.id ? r.data.data : t));
        setSelected(r.data.data);
        showToast('Saved');
      }
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected || selected.isSystem) return;
    setDeleting(true);
    try {
      await deleteEmailTemplate(selected.id);
      setTemplates(prev => prev.filter(t => t.id !== selected.id));
      setSelected(null);
      setIsNew(false);
      showToast('Deleted');
    } catch { showToast('Delete failed'); }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const handleReset = async () => {
    if (!selected) return;
    setResetting(true);
    try {
      const r = await resetEmailTemplate(selected.id);
      setTemplates(prev => prev.map(t => t.id === selected.id ? r.data.data : t));
      setSelected(r.data.data);
      setForm({ key: r.data.data.key, name: r.data.data.name, subject: r.data.data.subject, html: r.data.data.html, text: r.data.data.text ?? '' });
      setPreviewHtml('');
      showToast('Reset to default');
    } catch { showToast('Reset failed'); }
    setResetting(false);
  };

  const handlePreview = async () => {
    if (!selected) return;
    setPreviewing(true);
    try {
      // Save first so preview reflects current edits
      if (form.html !== selected.html || form.subject !== selected.subject) {
        await updateEmailTemplate(selected.id, { subject: form.subject, html: form.html });
      }
      const r = await previewEmailTemplate(selected.id);
      setPreviewHtml(r.data.data.html);
      setTab('preview');
    } catch { showToast('Preview failed'); }
    setPreviewing(false);
  };

  const handleSendTest = async () => {
    if (!selected || !testTo) return;
    setTestSending(true);
    setTestMsg('');
    try {
      await sendTestEmail(selected.id, testTo);
      setTestMsg(`✓ Sent to ${testTo}`);
    } catch { setTestMsg('✗ Send failed'); }
    setTestSending(false);
  };

  const detectedVars = extractVars(`${form.subject} ${form.html}`);
  const hasUnsavedChanges = selected && (form.subject !== selected.subject || form.html !== selected.html || form.name !== selected.name);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Email Templates</h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            Manage all outgoing emails. Changes take effect immediately.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm px-4 py-2">
          + New Template
        </button>
      </div>

      <div className="flex gap-5" style={{ minHeight: '70vh' }}>
        {/* ── Left panel: template list ── */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-1.5">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))
          ) : (
            templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => openTemplate(tpl)}
                className="w-full text-left px-3.5 py-3 rounded-xl transition-all"
                style={{
                  background: selected?.id === tpl.id ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.04)',
                  border: `1px solid ${selected?.id === tpl.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.08)'}`,
                }}
                onMouseEnter={e => { if (selected?.id !== tpl.id) (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={e => { if (selected?.id !== tpl.id) (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'; }}
              >
                <p className="text-sm font-medium text-white truncate">{tpl.name}</p>
                <p className="text-xs mt-0.5 font-mono truncate" style={{ color: '#475569' }}>{tpl.key}</p>
              </button>
            ))
          )}
        </div>

        {/* ── Right panel: editor ── */}
        <div className="flex-1 min-w-0">
          {!selected && !isNew ? (
            <div className="h-full flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.08)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">📧</div>
                <p className="font-semibold text-white mb-1">Select a template</p>
                <p className="text-sm" style={{ color: '#475569' }}>
                  Choose a template to edit, or create a new one.
                </p>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Editor header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <div className="flex items-center gap-3">
                  {isNew ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Template Key *</label>
                        <input
                          className="input text-xs font-mono"
                          placeholder="e.g. payment_reminder"
                          value={form.key}
                          onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Display Name *</label>
                        <input className="input text-xs" placeholder="e.g. Payment Reminder" value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          className="bg-transparent text-white font-semibold text-sm outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          style={{ fontFamily: 'Syne, Outfit, sans-serif' }}
                        />
                        {selected?.isSystem && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                            system
                          </span>
                        )}
                        {hasUnsavedChanges && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d' }}>
                            unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#475569' }}>{selected?.key}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isNew && selected && (
                    <>
                      <button onClick={handlePreview} disabled={previewing}
                        className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9' }}>
                        {previewing ? '…' : '👁 Preview'}
                      </button>
                      {selected.isSystem && (
                        <button onClick={handleReset} disabled={resetting}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
                          {resetting ? '…' : '↺ Reset'}
                        </button>
                      )}
                      {!selected.isSystem && !confirmDelete && (
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
                            {deleting ? '…' : 'Yes, Delete'}
                          </button>
                          <button onClick={() => setConfirmDelete(false)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                    {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 px-5 pt-3"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                {(['subject', 'html', 'preview'] as Tab[]).map(t => (
                  <button key={t} onClick={() => { if (t === 'preview' && !previewHtml) handlePreview(); else setTab(t); }}
                    className="px-4 py-2.5 text-sm font-medium capitalize transition-all"
                    style={{
                      color: tab === t ? '#a5b4fc' : '#475569',
                      borderBottom: `2px solid ${tab === t ? '#6366f1' : 'transparent'}`,
                      marginBottom: '-1px',
                    }}>
                    {t === 'html' ? 'HTML Content' : t === 'preview' ? '👁 Preview' : 'Subject Line'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5">
                {tab === 'subject' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Subject Line</label>
                      <input
                        className="input text-sm"
                        placeholder="e.g. Payment Confirmed — {{service}}"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      />
                      <p className="text-xs mt-1.5" style={{ color: '#334155' }}>
                        Use <code className="px-1 rounded font-mono" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{'{{variable}}'}</code> for dynamic values.
                      </p>
                    </div>

                    {/* Variable reference */}
                    {detectedVars.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#475569' }}>
                          Detected variables in this template:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {detectedVars.map(v => (
                            <div key={v} className="flex items-center gap-2">
                              <Badge label={v} />
                              {VARIABLE_DOCS[v] && (
                                <span className="text-xs" style={{ color: '#334155' }}>{VARIABLE_DOCS[v]}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test send */}
                    {!isNew && selected && (
                      <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', paddingTop: '1rem' }}>
                        <p className="label">Send Test Email</p>
                        <div className="flex gap-2 mt-1">
                          <input
                            className="input text-sm flex-1"
                            type="email"
                            placeholder="test@example.com"
                            value={testTo}
                            onChange={e => setTestTo(e.target.value)}
                          />
                          <button
                            onClick={handleSendTest}
                            disabled={testSending || !testTo}
                            className="btn-outline text-sm px-4 py-2 disabled:opacity-50 flex-shrink-0"
                          >
                            {testSending ? 'Sending…' : '✉ Send Test'}
                          </button>
                        </div>
                        {testMsg && (
                          <p className="text-xs mt-2" style={{ color: testMsg.startsWith('✓') ? '#4ade80' : '#f87171' }}>
                            {testMsg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'html' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="label mb-0">HTML Content</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['name', 'email', 'service', 'amount', 'date'] as const).map(v => (
                          <button key={v}
                            onClick={() => setForm(f => ({ ...f, html: f.html + `{{${v}}}` }))}
                            className="text-xs px-2 py-1 rounded-lg transition-all"
                            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#818cf8' }}
                            title={`Insert {{${v}}}`}
                          >
                            +{`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      className="input resize-y font-mono text-xs leading-relaxed"
                      rows={22}
                      placeholder="<!DOCTYPE html><html>…</html>"
                      value={form.html}
                      onChange={e => setForm(f => ({ ...f, html: e.target.value }))}
                      style={{ scrollbarWidth: 'thin' }}
                      spellCheck={false}
                    />
                    <p className="text-xs" style={{ color: '#334155' }}>
                      Full HTML supported. Use inline CSS for email client compatibility.
                    </p>
                  </div>
                )}

                {tab === 'preview' && (
                  <div className="space-y-3">
                    {previewHtml ? (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">Live Preview</p>
                          <button onClick={handlePreview} disabled={previewing}
                            className="text-xs px-3 py-1 rounded-lg transition-all"
                            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9' }}>
                            {previewing ? '…' : '↺ Refresh'}
                          </button>
                        </div>
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.12)', height: '500px' }}>
                          <iframe
                            ref={iframeRef}
                            title="Email Preview"
                            className="w-full h-full"
                            srcDoc={previewHtml}
                            style={{ border: 'none', background: '#080c14' }}
                          />
                        </div>
                        <p className="text-xs" style={{ color: '#334155' }}>
                          Preview uses sample data. Send a test email to see it in your inbox.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                          {previewing
                            ? <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
                            : <p className="text-4xl mb-3">👁</p>
                          }
                          <p className="text-sm" style={{ color: '#475569' }}>
                            {previewing ? 'Rendering preview…' : 'Click "Preview" to render the template'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium z-50"
            style={{ background: 'rgba(10,13,26,0.97)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
