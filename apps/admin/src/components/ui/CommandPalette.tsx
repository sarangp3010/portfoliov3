import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { globalSearch } from '../../api';
import { adminQueryKeys } from '../../lib/queryKeys';

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  href: string;
}

interface SearchResults {
  projects?: SearchResult[];
  posts?: SearchResult[];
  services?: SearchResult[];
  inquiries?: SearchResult[];
  customers?: SearchResult[];
  testimonials?: SearchResult[];
}

const TYPE_META: Record<string, { label: string; icon: string }> = {
  projects:     { label: 'Projects',     icon: '🗂' },
  posts:        { label: 'Blog Posts',   icon: '✍️' },
  services:     { label: 'Services',     icon: '💼' },
  inquiries:    { label: 'Inquiries',    icon: '📬' },
  customers:    { label: 'Customers',    icon: '👥' },
  testimonials: { label: 'Testimonials', icon: '💬' },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ open, onClose }: Props) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: adminQueryKeys.search(query),
    queryFn: () => globalSearch(query).then(r => r.data.data),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results: SearchResults = data?.results ?? {};
  const groups = Object.entries(results).filter(([, items]) => items && items.length > 0);
  const hasResults = groups.length > 0;

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            style={{ padding: '0 16px' }}
          >
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(13,16,33,0.98) 0%, rgba(8,10,22,0.99) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
              }}>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <span style={{ color: '#475569', fontSize: '16px' }}>🔍</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search projects, posts, customers, inquiries…"
                  className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-sm"
                  onKeyDown={e => e.key === 'Escape' && onClose()}
                />
                {isFetching && (
                  <span className="text-xs" style={{ color: '#475569' }}>searching…</span>
                )}
                <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#64748b', border: '1px solid rgba(99,102,241,0.15)' }}>
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {query.length >= 2 && !isFetching && !hasResults && (
                  <p className="px-4 py-8 text-center text-sm" style={{ color: '#475569' }}>
                    No results for "{query}"
                  </p>
                )}

                {query.length < 2 && (
                  <p className="px-4 py-6 text-center text-sm" style={{ color: '#334155' }}>
                    Type at least 2 characters to search
                  </p>
                )}

                {groups.map(([type, items]) => (
                  <div key={type}>
                    <p className="px-4 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-widest"
                      style={{ color: '#334155' }}>
                      {TYPE_META[type]?.icon} {TYPE_META[type]?.label}
                    </p>
                    {(items as SearchResult[]).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.href)}
                        className="w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors"
                        style={{ borderBottom: '1px solid rgba(99,102,241,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{item.label}</span>
                        {item.sub && (
                          <span className="text-xs truncate" style={{ color: '#475569' }}>{item.sub}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center gap-4"
                style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                <span className="text-xs" style={{ color: '#1e293b' }}>
                  <kbd className="px-1 py-0.5 rounded text-xs mr-1"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#475569', border: '1px solid rgba(99,102,241,0.15)' }}>
                    ⌘K
                  </kbd>
                  to open
                </span>
                <span className="text-xs" style={{ color: '#1e293b' }}>
                  <kbd className="px-1 py-0.5 rounded text-xs mr-1"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#475569', border: '1px solid rgba(99,102,241,0.15)' }}>
                    Enter
                  </kbd>
                  to navigate
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
