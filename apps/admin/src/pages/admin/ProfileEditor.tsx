import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Profile } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminContentMutations, useAdminProfileQuery } from '../../hooks/queries/useContentManagerQueries';

// Field is defined OUTSIDE ProfileEditor so React sees a stable component
// identity across renders. Defining it inside caused unmount/remount on every
// keystroke (loss of input focus).
interface FieldProps {
  label: string; name: keyof Profile; type?: string; placeholder?: string;
  value: string; onChange: (name: keyof Profile, v: string | number) => void;
}
const Field = ({ label, name, type = 'text', placeholder = '', value, onChange }: FieldProps) => (
  <div>
    <label className="label">{label}</label>
    <input type={type} className="input" placeholder={placeholder} value={value}
      onChange={e => onChange(name, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} />
  </div>
);

export default function ProfileEditor() {
  const { data, isLoading: loading } = useAdminProfileQuery();
  const { updateProfile: updateProfileMutation } = useAdminContentMutations();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (data) setProfile(data);
  }, [data]);

  const set = (key: keyof Profile, value: unknown) => setProfile(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setError(''); setSaved(false);
    try { await updateProfileMutation.mutateAsync({ ...profile }); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { setError(err.response?.data?.error ?? 'Save failed'); }
  };

  const saving = updateProfileMutation.isPending;

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <>
      <Helmet><title>Profile Editor — Admin</title></Helmet>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Profile</h1>
            <p className="text-slate-500 mt-1">Edit your public profile content</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-emerald-400 text-sm">✓ Saved</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-white mb-2">Basic Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" name="name"  value={profile.name  ?? ''} onChange={set} />
              <Field label="Title"     name="title" value={profile.title ?? ''} onChange={set} placeholder="Full-Stack Software Engineer" />
            </div>
            <div>
              <label className="label">Short Bio</label>
              <textarea className="input resize-none" rows={2} value={profile.bioShort ?? ''} onChange={e => set('bioShort', e.target.value)} placeholder="One-line bio for hero section" />
            </div>
            <div>
              <label className="label">Full Bio</label>
              <textarea className="input resize-none" rows={6} value={profile.bio ?? ''} onChange={e => set('bio', e.target.value)} placeholder="Full bio — separate paragraphs with blank lines" />
            </div>
            <Field label="Avatar URL" name="avatarUrl" value={profile.avatarUrl ?? ''} onChange={set} placeholder="https://..." />
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-white mb-2">Contact & Location</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email"    name="email"    type="email" value={profile.email    ?? ''} onChange={set} />
              <Field label="Phone"    name="phone"                 value={profile.phone    ?? ''} onChange={set} placeholder="+1 (555) 000-0000" />
              <Field label="Location" name="location"              value={profile.location ?? ''} onChange={set} placeholder="San Francisco, CA" />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-white mb-2">Social Links</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="GitHub URL"   name="githubUrl"   value={profile.githubUrl   ?? ''} onChange={set} placeholder="https://github.com/..." />
              <Field label="LinkedIn URL" name="linkedinUrl" value={profile.linkedinUrl ?? ''} onChange={set} placeholder="https://linkedin.com/in/..." />
              <Field label="Twitter URL"  name="twitterUrl"  value={profile.twitterUrl  ?? ''} onChange={set} placeholder="https://twitter.com/..." />
              <Field label="Website URL"  name="websiteUrl"  value={profile.websiteUrl  ?? ''} onChange={set} placeholder="https://..." />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-display font-bold text-white mb-2">Skills & Stats</h2>
            <div>
              <label className="label">Skills (comma-separated)</label>
              <textarea className="input resize-none" rows={3}
                value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills ?? ''}
                onChange={e => set('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="React, TypeScript, Node.js, ..." />
            </div>
            <div>
              <label className="label">Tech Stack (comma-separated)</label>
              <textarea className="input resize-none" rows={3}
                value={Array.isArray(profile.techStack) ? profile.techStack.join(', ') : profile.techStack ?? ''}
                onChange={e => set('techStack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="React, TypeScript, Node.js, ..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="label">Years Experience</label><input type="number" className="input" value={profile.yearsExp ?? 0} min={0} onChange={e => set('yearsExp', parseInt(e.target.value) || 0)} /></div>
              <div><label className="label">Projects Count</label><input type="number" className="input" value={profile.projectCount ?? 0} min={0} onChange={e => set('projectCount', parseInt(e.target.value) || 0)} /></div>
              <div><label className="label">Clients Count</label><input type="number" className="input" value={profile.clientCount ?? 0} min={0} onChange={e => set('clientCount', parseInt(e.target.value) || 0)} /></div>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={profile.available ?? false} onChange={e => set('available', e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-6 bg-slate-700 rounded-full peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-4" />
              </label>
              <span className="text-slate-300 text-sm">Available for new projects</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
