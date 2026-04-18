import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getPosts, getTags } from '../../api';
import { BlogPost } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sp, setSp] = useSearchParams();
  const activeTag = sp.get('tag') ?? undefined;
  const page = parseInt(sp.get('page') ?? '1', 10);

  useEffect(() => {
    setLoading(true);
    Promise.all([getPosts({ page, tag: activeTag }), getTags()])
      .then(([pr, tr]) => { setPosts(pr.data.data.posts); setTotal(pr.data.data.total); setTags(tr.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, activeTag]);

  if (loading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Blog — Writing on Software Engineering</title></Helmet>
      <section className="section">
        <div className="container-max">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
            <p className="section-label mb-4">Writing</p>
            <h1 className="font-display text-5xl font-bold text-white mb-4">Blog</h1>
            <p className="text-slate-400 max-w-xl text-lg">Thoughts on software engineering, architecture, and things I've learned the hard way.</p>
          </motion.div>

          {/* Tag filter */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <button onClick={() => setSp({})} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!activeTag ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                All ({total})
              </button>
              {tags.map(tag => (
                <button key={tag} onClick={() => setSp({ tag })} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTag === tag ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-24 text-slate-500">No articles yet — check back soon.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="card-hover group flex flex-col overflow-hidden"
                >
                  {/* Cover gradient placeholder */}
                  <div className="h-44 bg-gradient-to-br from-accent/10 via-purple-900/20 to-slate-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="font-display text-8xl font-bold text-white">{post.title[0]}</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 3).map(tag => <span key={tag} className="tag text-xs">{tag}</span>)}
                    </div>
                    <h2 className="font-display font-bold text-white mb-2 leading-snug group-hover:text-accent transition-colors line-clamp-2">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-5">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-4 border-t border-slate-800">
                      <span>{fmt(post.publishedAt)}</span>
                      <div className="flex items-center gap-3">
                        <span>{post.views} views</span>
                        <span>·</span>
                        <span>{post.readingTime} min</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
