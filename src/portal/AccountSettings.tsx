import { useState, FormEvent } from 'react';

type Profile = { name: string; email: string };

export default function AccountSettings({ profile, onUpdated }: { profile: Profile; onUpdated: (p: any) => void }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const body: Record<string, unknown> = { name, email };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    const res = await fetch('/api/client/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Could not save changes.');
    setSuccess('Account updated.');
    setCurrentPassword('');
    setNewPassword('');
    onUpdated(data);
    setTimeout(() => setSuccess(''), 3000);
  }

  return (
    <div className="portal-card">
      <h2 className="portal-h2">Account &amp; password</h2>
      <p className="portal-sub" style={{ marginTop: -2 }}>Update your name, email or password. Changing your password requires your current one.</p>
      {error && <div className="portal-error">{error}</div>}
      {success && <div className="portal-success">{success}</div>}
      <form onSubmit={onSubmit}>
        <div className="portal-grid-2">
          <div className="portal-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="portal-field">
            <label>Login email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="portal-field">
            <label>Current password</label>
            <input type="password" placeholder="Only needed if setting a new password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="portal-field">
            <label>New password</label>
            <input type="password" placeholder="Leave blank to keep current password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <button className="pill-btn solid" disabled={saving}>{saving ? 'Saving…' : 'Save account changes'}</button>
      </form>
    </div>
  );
}
