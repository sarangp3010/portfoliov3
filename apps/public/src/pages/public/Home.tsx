import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getProfile, getProjects, trackProjectClick } from '../../api';
import { Profile, Project } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';
import { trackEvent, trackProjectGithubClick, trackProjectDemoClick, trackProjectView } from '../../hooks/useTracker';
import { useTilt } from '../../hooks/useTilt';
import { useSections } from '../../hooks/useSections';
import { DynamicSection } from '../../components/ui/DynamicSection';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }),
};

/* ── 3D Tilt Project Card ─────────────────────────────────────── */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useTilt<HTMLDivElement>({ maxTilt: 6, scale: 1.02 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover p-6 group"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
          }}>
          {project.title[0]}
        </div>
        <div className="flex gap-2">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => { trackProjectClick(project.id); trackProjectGithubClick(project.id, project.title, project.githubUrl!); }}
              className="transition-all duration-200 hover:scale-110"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e2e8f0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => trackProjectDemoClick(project.id, project.title, project.liveUrl!)}
              className="transition-all duration-200 hover:scale-110"
              style={{ color: '#475569' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e2e8f0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          )}
        </div>
      </div>
      <h3 className="font-display font-bold text-white mb-2 cursor-pointer transition-all duration-200"
        style={{ fontSize: '1.05rem' }}
        onClick={() => trackProjectView(project.id, project.title)}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
      >
        {project.title}
      </h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#64748b' }}>{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.techStack.slice(0, 4).map(t => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-md font-mono"
            style={{ background: 'rgba(99,102,241,0.08)', color: '#64748b', border: '1px solid rgba(99,102,241,0.12)' }}>
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Stat counter ─────────────────────────────────────────────── */
function StatItem({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="relative"
    >
      <p className="font-display text-4xl font-bold mb-1"
        style={{ background: 'linear-gradient(135deg, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value}
      </p>
      <p className="text-sm" style={{ color: '#475569' }}>{label}</p>
    </motion.div>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { getSection } = useSections('home');

  useEffect(() => {
    Promise.all([getProfile(), getProjects()])
      .then(([pr, prj]) => {
        setProfile(pr.data.data);
        setProjects(prj.data.data.filter((p: Project) => p.featured).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!profile) return null;

  // Section config — falls back gracefully to profile/defaults if not configured
  const heroSection     = getSection('hero');
  const projectsSection = getSection('projects');
  const ctaSection      = getSection('cta');

  // Hero content: admin config overrides, profile data as fallback
  const heroTitle    = heroSection?.title    ?? profile.title;
  const heroSubtitle = heroSection?.subtitle ?? profile.bioShort;
  const heroCtaText  = heroSection?.ctaText  ?? 'Work With Me';
  const heroCtaLink  = heroSection?.ctaLink  ?? '/services';

  // Hide sections based on config
  const showProjects = projectsSection?.isVisible !== false;
  const showCta      = ctaSection?.isVisible !== false;

  if (loading) return <PageLoader />;
  if (!profile) return null;

  const stats = [
    { value: `${profile.yearsExp}+`, label: 'Years Experience' },
    { value: `${profile.projectCount}+`, label: 'Projects Shipped' },
    { value: `${profile.clientCount}+`, label: 'Happy Clients' },
  ];

  return (
    <>
      <Helmet>
        <title>{profile.name} — {profile.title}</title>
        <meta name="description" content={profile.bioShort} />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[94vh] flex items-center overflow-hidden">
        {/* Deep radial glow behind content */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 40%, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-3/4 h-3/4"
            style={{ background: 'radial-gradient(ellipse 50% 50% at 70% 70%, rgba(6,182,212,0.06) 0%, transparent 60%)' }} />
        </div>

        {/* Floating 3D terminal card — decorative */}
        <div className="absolute right-8 top-1/4 hidden xl:block pointer-events-none"
          style={{ animation: 'floatElement 8s ease-in-out infinite' }}>
          <div className="w-72 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10,13,26,0.85)',
              border: '1px solid rgba(99,102,241,0.15)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
              transform: 'perspective(600px) rotateY(-8deg) rotateX(3deg)',
            }}>
            {/* Terminal header */}
            <div className="flex items-center gap-1.5 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.1)', background: 'rgba(5,7,15,0.6)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="ml-2 text-xs font-mono" style={{ color: '#334155' }}>~/portfolio</span>
            </div>
            {/* Terminal body */}
            <div className="p-4 font-mono text-xs leading-relaxed" style={{ color: '#64748b' }}>
              <div><span style={{ color: '#818cf8' }}>$</span> <span style={{ color: '#94a3b8' }}>npm run dev</span></div>
              <div style={{ color: '#22c55e' }} className="mt-1">✓ Ready on localhost:3000</div>
              <div className="mt-2"><span style={{ color: '#818cf8' }}>$</span> <span style={{ color: '#94a3b8' }}>git push origin main</span></div>
              <div style={{ color: '#06b6d4' }} className="mt-1">→ Deploying to production...</div>
              <div style={{ color: '#22c55e' }}>✓ Deployed successfully</div>
              <div className="mt-2 flex items-center gap-1">
                <span style={{ color: '#818cf8' }}>$</span>
                <span style={{ color: '#94a3b8' }}>_</span>
                <span className="inline-block w-1.5 h-3.5 ml-0.5"
                  style={{ background: '#6366f1', animation: 'cursorBlink 1s step-end infinite' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Floating metrics card */}
        <div className="absolute right-12 bottom-1/3 hidden xl:block pointer-events-none"
          style={{ animation: 'floatElement 11s ease-in-out infinite', animationDelay: '-4s' }}>
          <div className="px-5 py-4 rounded-2xl"
            style={{
              background: 'rgba(10,13,26,0.8)',
              border: '1px solid rgba(6,182,212,0.15)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              transform: 'perspective(600px) rotateY(-6deg)',
            }}>
            <p className="text-xs font-mono mb-2" style={{ color: '#475569' }}>Performance</p>
            <div className="flex items-end gap-1">
              {[60, 85, 70, 95, 80, 100, 88].map((h, i) => (
                <div key={i} className="w-3 rounded-sm"
                  style={{
                    height: `${h * 0.4}px`,
                    background: i === 5
                      ? 'linear-gradient(to top, #6366f1, #06b6d4)'
                      : 'rgba(99,102,241,0.2)',
                    transition: 'height 0.3s ease',
                  }} />
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: '#06b6d4' }}>↑ 24% this week</p>
          </div>
        </div>

        <div className="container-max relative z-10">
          <div className="max-w-3xl">
            {/* Available badge */}
            {profile.available && (
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
                className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  color: '#86efac',
                  boxShadow: '0 0 24px rgba(34,197,94,0.1)',
                }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 8px rgba(34,197,94,0.8)', animation: 'pulse 2s ease-in-out infinite' }} />
                Available for new projects
              </motion.div>
            )}

            <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="font-display leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 800 }}>
              <span style={{
                background: 'linear-gradient(135deg, #fff 0%, #e2e8f0 50%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Hi, I'm {profile.name.split(' ')[0]}.
              </span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 50%, #6366f1 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'gradientShift 5s ease infinite',
                fontSize: '0.78em',
                fontWeight: 700,
              }}>
                {heroTitle}
              </span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl"
              style={{ color: '#64748b' }}>
              {heroSubtitle}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="flex flex-wrap gap-4 mb-16">
              <Link to={heroCtaLink} onClick={() => trackEvent('BUTTON_CLICK', { target: 'hire-me-btn', legacyEventType: 'BUTTON_CLICK' })}
                className="btn-primary text-base px-8 py-3.5">
                {heroCtaText}
              </Link>
              <Link to="/resume" onClick={() => trackEvent('BUTTON_CLICK', { target: 'view-resume-btn', legacyEventType: 'BUTTON_CLICK' })}
                className="btn-outline text-base px-8 py-3.5">
                View Resume
              </Link>
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('EXTERNAL_LINK', { target: profile.githubUrl, contentTitle: 'github', legacyEventType: 'EXTERNAL_LINK' })}
                  className="btn-ghost text-base px-6 py-3.5">
                  GitHub ↗
                </a>
              )}
            </motion.div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-10">
              {stats.map((s, i) => (
                <StatItem key={s.label} value={s.value} label={s.label} delay={4 + i} />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#334155' }}>scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="w-1 h-2 rounded-full" style={{ background: '#6366f1' }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
        <div className="container-max grid lg:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <p className="section-label mb-4">About Me</p>
            <h2 className="font-display text-4xl font-bold text-white mb-6">Passionate about great software</h2>
            <div className="space-y-4">
              {profile.bio.split('\n\n').map((para, i) => (
                <p key={i} className="leading-relaxed" style={{ color: '#64748b' }}>{para}</p>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('EXTERNAL_LINK', { target: profile.linkedinUrl, contentTitle: 'linkedin', legacyEventType: 'EXTERNAL_LINK' })}
                  className="btn-outline text-sm px-4 py-2">LinkedIn</a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('EXTERNAL_LINK', { target: profile.githubUrl, contentTitle: 'github', legacyEventType: 'EXTERNAL_LINK' })}
                  className="btn-ghost text-sm px-4 py-2">GitHub</a>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
            <p className="section-label mb-4">Tech Stack</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {profile.skills.map((skill) => (
                <span key={skill} className="tag">{skill}</span>
              ))}
            </div>
            {profile.location && (
              <div className="card p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}>
                  📍
                </div>
                <div>
                  <p className="text-white font-medium">{profile.location}</p>
                  <p className="text-sm" style={{ color: '#475569' }}>Based in</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Projects ──────────────────────────────────────────── */}
      {projects.length > 0 && showProjects && (
        <DynamicSection
          animation={projectsSection?.animation ?? { type: 'fade', direction: 'up', duration: 'normal', trigger: 'scroll' }}
          style={projectsSection?.style ?? {}}
          className="section"
        >
          <div className="container-max">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-label mb-3">Portfolio</p>
                <h2 className="font-display text-4xl font-bold text-white">
                  {projectsSection?.title ?? 'Featured Work'}
                </h2>
                {projectsSection?.subtitle && (
                  <p className="mt-2" style={{ color: '#64748b' }}>{projectsSection.subtitle}</p>
                )}
              </div>
              <Link to="/services" className="btn-ghost text-sm hidden sm:flex">See all work →</Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </div>
        </DynamicSection>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      {showCta && (
      <DynamicSection
        animation={ctaSection?.animation ?? { type: 'scale', direction: 'up', duration: 'normal', trigger: 'scroll' }}
        style={ctaSection?.style ?? {}}
        className="section"
      >
        <div className="container-max text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', transform: 'scale(2)' }} />
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 relative">
                {ctaSection?.title ?? "Let's build something great"}
              </h2>
            </div>
            <p className="mb-8 max-w-md mx-auto" style={{ color: '#475569' }}>
              {ctaSection?.subtitle ?? "Have a project in mind? I'd love to hear about it."}
            </p>
            <Link to={ctaSection?.ctaLink ?? '/services'}
              onClick={() => trackEvent('BUTTON_CLICK', { target: 'cta-services', legacyEventType: 'BUTTON_CLICK' })}
              className="btn-primary text-base px-10 py-4">
              {ctaSection?.ctaText ?? 'View Services & Get in Touch →'}
            </Link>
          </motion.div>
        </div>
      </DynamicSection>
      )}

      <style>{`
        @keyframes gradientShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes floatElement {
          0%,100% { transform: perspective(600px) rotateY(-8deg) rotateX(3deg) translateY(0); }
          50%      { transform: perspective(600px) rotateY(-8deg) rotateX(3deg) translateY(-12px); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.7; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}
