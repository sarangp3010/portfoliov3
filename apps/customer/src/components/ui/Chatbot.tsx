/**
 * Chatbot.tsx — Exploratory portfolio assistant
 * Floating widget for public and customer portals.
 * Sends messages to /api/chat, renders rich markdown, shows contextual suggestions.
 */

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  suggestions?: string[];
  expanded?: boolean;
}

interface ChatbotProps {
  authToken?: string;
  context?: 'public' | 'customer';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WELCOME: Record<string, string> = {
  public:   "Hi! 👋 I'm your portfolio assistant. I can help you explore projects, services, pricing, and the developer's background.\n\nWhat would you like to know?",
  customer: "Hi! 👋 I'm your account assistant. I can help you explore services, understand your purchases, or answer questions about the platform.",
};

// Topic pills shown before the user sends anything
const TOPIC_PILLS: Record<string, { label: string; prompt: string }[]> = {
  public: [
    { label: '🗂 Projects',    prompt: 'Show me your portfolio projects' },
    { label: '💼 Services',   prompt: 'What services do you offer?' },
    { label: '💰 Pricing',    prompt: 'What are your pricing plans?' },
    { label: '🛠 Tech Stack', prompt: 'What technologies do you work with?' },
    { label: '🔗 GitHub',     prompt: "What's your GitHub profile?" },
    { label: '👤 About',      prompt: 'Tell me about your background and experience' },
  ],
  customer: [
    { label: '💳 My Purchases', prompt: 'What services have I purchased?' },
    { label: '💼 Services',    prompt: 'What services are available?' },
    { label: '💰 Pricing',     prompt: 'What are the pricing plans?' },
    { label: '📞 Support',     prompt: 'How do I contact support?' },
  ],
};

const LONG_MSG_THRESHOLD = 400; // chars — above this, offer expand

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  // Process line by line for headers, lists, then inline markdown
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { elements.push(<br key={`br${i}`} />); i++; continue; }

    // H3: ###
    if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="font-bold text-white mt-3 mb-1" style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.85rem' }}>
          {renderInline(line.slice(4))}
        </p>
      );
      i++; continue;
    }

    // H2: ##
    if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="font-bold mt-2 mb-1" style={{ color: '#a5b4fc', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {renderInline(line.slice(3))}
        </p>
      );
      i++; continue;
    }

    // Bullet list: lines starting with - or *
    if (/^[-*•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•] /, ''));
        i++;
      }
      elements.push(
        <ul key={`ul${i}`} className="space-y-1 my-2 ml-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm" style={{ color: '#94a3b8' }}>
              <span style={{ color: '#6366f1', flexShrink: 0 }}>›</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let n = 1;
      while (i < lines.length && new RegExp(`^${n}\\. `).test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++; n++;
      }
      elements.push(
        <ol key={`ol${i}`} className="space-y-1 my-2 ml-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm" style={{ color: '#94a3b8' }}>
              <span style={{ color: '#6366f1', flexShrink: 0, minWidth: '1rem' }}>{j + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**, `code`, and [text](url) links
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[.+?\]\(https?:\/\/\S+?\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: '#e2e8f0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} className="px-1 py-0.5 rounded text-xs font-mono"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{part.slice(1, -1)}</code>;
        // [text](url) link
        const linkMatch = part.match(/^\[(.+?)\]\((https?:\/\/\S+?)\)$/);
        if (linkMatch)
          return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
            style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            onClick={e => e.stopPropagation()}>{linkMatch[1]}</a>;
        // Plain URL
        if (/^https?:\/\/\S+$/.test(part.trim()))
          return <a key={i} href={part.trim()} target="_blank" rel="noopener noreferrer"
            style={{ color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            onClick={e => e.stopPropagation()}>{part.trim()}</a>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#6366f1', animation: 'chatDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function MessageBubble({
  msg,
  onSuggestion,
  onToggleExpand,
}: {
  msg: Message;
  onSuggestion: (s: string) => void;
  onToggleExpand: (id: string) => void;
}) {
  const isUser = msg.role === 'user';
  const isLong = !isUser && msg.content.length > LONG_MSG_THRESHOLD;
  const showFull = msg.expanded ?? false;
  const displayContent = isLong && !showFull
    ? msg.content.slice(0, LONG_MSG_THRESHOLD) + '…'
    : msg.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontSize: '12px' }}>
          ✦
        </div>
      )}

      <div className="max-w-[86%] flex flex-col gap-1.5">
        {/* Bubble */}
        <div
          className="px-3.5 py-2.5 rounded-2xl text-sm"
          style={isUser ? {
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            borderBottomRightRadius: '6px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          } : {
            background: 'rgba(12,17,32,0.95)',
            border: '1px solid rgba(99,102,241,0.14)',
            borderBottomLeftRadius: '6px',
          }}
        >
          {isUser
            ? <p className="text-sm leading-relaxed">{msg.content}</p>
            : renderMarkdown(displayContent)
          }
        </div>

        {/* Expand / collapse for long messages */}
        {isLong && (
          <button
            onClick={() => onToggleExpand(msg.id)}
            className="self-start text-xs px-2 py-0.5 rounded-lg transition-colors ml-0.5"
            style={{ color: '#818cf8', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            {showFull ? '↑ Show less' : '↓ Show more'}
          </button>
        )}

        {/* Follow-up suggestion chips */}
        {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1 ml-0.5">
            {msg.suggestions.map(s => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="text-xs px-2.5 py-1 rounded-full transition-all"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: '#818cf8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.16)'; (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = '#818cf8'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Chatbot({ authToken, context = 'public' }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME[context], id: 'welcome' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const msgId       = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && open) setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  const doSend = useCallback(async (text: string, currentMessages: Message[]) => {
    if (!text.trim() || loading) return;
    setError('');

    const userMsg: Message = { role: 'user', content: text, id: `u${++msgId.current}` };
    const nextMessages = [...currentMessages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = nextMessages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/chat', {
        method: 'POST', headers,
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get response');

      const botMsg: Message = {
        role: 'assistant',
        content: data.data.reply,
        id: `a${++msgId.current}`,
        suggestions: data.data.suggestions ?? [],
        expanded: false,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, authToken]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    doSend(text, messages);
  };

  const handleSuggestion = (s: string) => {
    doSend(s, messages);
  };

  const handleToggleExpand = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, expanded: !m.expanded } : m));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const pills = TOPIC_PILLS[context];
  const showTopicPills = messages.length === 1 && !loading;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9998]">
        {/* Toggle button */}
        <AnimatePresence mode="wait">
          {!open && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                boxShadow: '0 8px 32px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)',
              }}
              title="Open assistant"
            >
              <span className="absolute inset-0 rounded-full"
                style={{ border: '2px solid rgba(99,102,241,0.4)', animation: 'chatPulse 2.5s ease-out infinite' }} />
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="window"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="absolute bottom-0 right-0 flex flex-col"
              style={{
                width: 'min(420px, calc(100vw - 16px))',
                height: 'min(600px, calc(100vh - 96px))',
                background: 'linear-gradient(180deg, rgba(7,9,18,0.99) 0%, rgba(4,6,13,1) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '20px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Glow line */}
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.55), rgba(6,182,212,0.35), transparent)' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                    ✦
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
                      Portfolio Assistant
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'chatPulse 2s ease-out infinite' }} />
                      <span className="text-xs" style={{ color: '#334155' }}>
                        {loading ? 'Thinking…' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Clear + Close */}
                <div className="flex items-center gap-1">
                  {messages.length > 1 && (
                    <button
                      onClick={() => setMessages([{ role: 'assistant', content: WELCOME[context], id: 'welcome' }])}
                      className="p-1.5 rounded-lg text-xs transition-all"
                      style={{ color: '#334155' }}
                      title="Clear conversation"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94a3b8'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#334155'}
                    >
                      ↺
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2" style={{ scrollbarWidth: 'thin' }}>
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onSuggestion={handleSuggestion}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}

                {/* Typing indicator */}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontSize: '12px' }}>✦</div>
                    <div className="rounded-2xl rounded-bl"
                      style={{ background: 'rgba(12,17,32,0.95)', border: '1px solid rgba(99,102,241,0.14)' }}>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-3 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
                    {error}
                    <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
                  </div>
                )}

                {/* Topic pills — shown before first message */}
                {showTopicPills && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="mb-3">
                    <p className="text-xs mb-2 ml-0.5" style={{ color: '#334155' }}>Explore topics:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pills.map(pill => (
                        <button
                          key={pill.label}
                          onClick={() => doSend(pill.prompt, messages)}
                          className="text-xs px-2.5 py-1.5 rounded-full transition-all"
                          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.16)', color: '#64748b' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'; (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.07)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(12,17,32,0.9)', border: '1px solid rgba(99,102,241,0.16)' }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask about projects, services, pricing…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: '#e2e8f0', fontFamily: 'Outfit, system-ui, sans-serif' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                    onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(99,102,241,0.55)'; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)'}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-xs mt-1.5" style={{ color: '#1e293b' }}>
                  Portfolio context only · Powered by AI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes chatPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
