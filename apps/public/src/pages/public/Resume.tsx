import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getProfile, getActiveResume } from '../../api';
import { Profile, Resume } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';
import { trackResumePageVisit, trackResumeDownload } from '../../hooks/useTracker';
import { downloadResumePDF, downloadPortfolioPDF } from '../../utils/pdf';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const skills: Record<string, string[]> = {
  'Frontend': ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
  'Backend': ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'REST APIs', 'Redis'],
  'DevOps': ['Docker', 'AWS', 'CI/CD', 'GitHub Actions', 'Nginx'],
  'Tools': ['Git', 'Figma', 'Postman', 'VS Code', 'Linux'],
};

const certs = [
  { name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', year: '2024' },
  { name: 'Professional Scrum Master I', issuer: 'Scrum.org', year: '2023' },
];

export default function ResumePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile(), getActiveResume()])
      .then(([pr, res]) => { setProfile(pr.data.data); setResume(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    trackResumePageVisit();
  }, []);

  const handleDownload = () => {
    trackResumeDownload();
    window.open('/api/resume/download', '_blank');
  };

  if (loading) return <PageLoader />;
  if (!profile) return null;

  return (
    <>
      <Helmet><title>Resume — {profile.name}</title></Helmet>

      {/* Controls bar */}
      <div className="print:hidden sticky top-16 z-40 py-3 backdrop-blur-xl"
        style={{ background: 'rgba(3,5,15,0.9)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div className="container-max flex items-center justify-between max-w-4xl">
          <p className="text-slate-500 text-sm font-mono">resume.pdf</p>
          <div className="flex gap-3">
            <button onClick={() => downloadResumePDF()} className="btn-ghost text-sm px-4 py-2">📄 Resume PDF</button>
            <button onClick={() => downloadPortfolioPDF()} className="btn-ghost text-sm px-4 py-2">🗂 Portfolio PDF</button>
            <button onClick={() => window.print()} className="btn-ghost text-sm px-4 py-2">🖨 Print</button>
            <button onClick={handleDownload} className="btn-primary text-sm px-4 py-2">
              ⬇ Download PDF
              {resume && <span className="ml-1.5 text-xs opacity-70">v{resume.version}</span>}
            </button>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            {/* Header */}
            <header className="border-b border-slate-800 pb-8">
              <h1 className="font-display text-5xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-accent text-xl font-semibold mb-5">{profile.title}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-mono">
                {[
                  { icon: '✉', label: profile.email, href: `mailto:${profile.email}` },
                  profile.githubUrl && { icon: '⌂', label: profile.githubUrl.replace('https://',''), href: profile.githubUrl },
                  profile.linkedinUrl && { icon: '⚡', label: 'LinkedIn', href: profile.linkedinUrl },
                  profile.location && { icon: '◎', label: profile.location },
                ].filter(Boolean).map((item: any) => item.href ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{item.icon} {item.label}</a>
                ) : (
                  <span key={item.label}>{item.icon} {item.label}</span>
                ))}
              </div>
            </header>

            {/* Summary */}
            <Sec title="Summary">
              <p className="text-slate-400 leading-relaxed">{profile.bioShort}</p>
            </Sec>

            {/* Skills */}
            <Sec title="Technical Skills">
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries(skills).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-600 mb-2">{cat}</p>
                    <p className="text-slate-400 text-sm">{items.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </Sec>

            {/* Certifications */}
            <Sec title="Certifications">
              <div className="grid sm:grid-cols-2 gap-4">
                {certs.map(c => (
                  <div key={c.name} className="card p-4 flex gap-3">
                    <span className="text-2xl">🏅</span>
                    <div>
                      <p className="font-medium text-white text-sm">{c.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{c.issuer} · {c.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            {/* Download CTA */}
            <div className="text-center pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-sm mb-4">Download the full resume for complete experience & education details</p>
              <button onClick={handleDownload} className="btn-primary px-8 py-3.5">
                ⬇ Download Full PDF Resume
              </button>
              {resume && <p className="text-slate-600 text-xs mt-3 font-mono">Version {resume.version} · Downloaded {resume.downloadCount} times</p>}
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`@media print { @page { margin: 1.5cm; size: A4; } .print\\:hidden { display: none !important; } }`}</style>
    </>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-mono text-xs font-bold uppercase tracking-[3px] text-accent mb-5">{title}</h2>
      {children}
    </section>
  );
}
