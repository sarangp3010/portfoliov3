import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getPost } from '../../api';
import { BlogPost } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';
import { useBlogTracker, trackBlogLinkClick } from '../../hooks/useTracker';

// Markdown → HTML renderer (no external dep)
const md2html = (md: string): string => {
  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_,lang,code) =>
      `<pre data-lang="${lang}"><code>${esc(code.trimEnd())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 style="color:#94a3b8;font-size:1rem;font-weight:600;margin:1.5rem 0 0.5rem">$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ');
      return `<tr>${cells.map((c: string) => c.includes('---') ? '' : `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, m => `<div style="overflow-x:auto"><table>${m}</table></div>`)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^(?!<[a-z|/])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
};

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // Fires BLOG_VIEW, tracks scroll depth + time on page
  useBlogTracker(slug ?? '', post?.title ?? '');

  useEffect(() => {
    if (!slug) return;
    getPost(slug)
      .then(r => { setPost(r.data.data); })
      .catch(() => navigate('/blog', { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return <PageLoader />;
  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      <article className="section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-accent text-sm mb-10 transition-colors">
              ← Back to Blog
            </Link>

            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">{post.title}</h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">{post.excerpt}</p>

            <div className="flex items-center gap-4 text-sm text-slate-600 font-mono pb-8 border-b border-slate-800">
              <span>{fmt(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTime} min read</span>
              <span>·</span>
              <span>{post.views} views</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="prose-dark mt-10"
            dangerouslySetInnerHTML={{ __html: md2html(post.content) }}
          />

          <div className="mt-16 pt-8 border-t border-slate-800 flex items-center justify-between">
            <Link to="/blog" onClick={() => trackBlogLinkClick(slug ?? '', post.title, '/blog')} className="btn-outline text-sm px-4 py-2">← All Posts</Link>
            <Link to="/services" onClick={() => trackBlogLinkClick(slug ?? '', post.title, '/services')} className="btn-primary text-sm px-4 py-2">Work Together →</Link>
          </div>
        </div>
      </article>
    </>
  );
}
