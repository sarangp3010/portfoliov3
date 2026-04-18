import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { changePassword } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');

  const handleChangePassword = async () => {
    setErr(''); setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) { setErr('All fields are required'); return; }
    if (newPassword.length < 8) { setErr('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setErr('Passwords do not match'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Failed to update password'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Helmet><title>Settings — Admin</title></Helmet>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your admin account</p>
        </div>

        {/* Account Info */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Name</span>
              <span className="text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Email</span>
              <span className="text-white font-mono text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400 text-sm">Role</span>
              <span className="badge-purple">ADMIN</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-white mb-1">Change Password</h2>
          <p className="text-slate-500 text-sm mb-5">Choose a strong password with at least 8 characters.</p>

          {err     && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{err}</p>}
          {success && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">✓ {success}</p>}

          <div className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button onClick={handleChangePassword} disabled={saving} className="btn-primary min-w-[160px]">
              {saving ? <Spinner size="sm" /> : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-red-500/20">
          <h2 className="font-display font-bold text-white mb-1">Security Tips</h2>
          <ul className="text-slate-500 text-sm space-y-2 mt-3">
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span> Use a unique, strong password not used elsewhere</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span> Keep your login credentials private — this is the only admin account</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span> The admin panel is protected by JWT authentication (24h session)</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-0.5">•</span> For lost access, reset via server: <code className="font-mono text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">npm run seed</code></li>
          </ul>
        </div>
      </div>
    </>
  );
}
