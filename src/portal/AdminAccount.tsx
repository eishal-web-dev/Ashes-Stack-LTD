import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import AccountSettings from './AccountSettings';
import BrandLoader from './BrandLoader';
import AdminLayout from './AdminLayout';

export default function AdminAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [mailConfigured, setMailConfigured] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      const status = await fetch('/api/admin/mail-status').then((r) => r.json());
      setMailConfigured(status.configured);
      setLoading(false);
    });
  }, [navigate]);

  async function sendTestEmail() {
    setTesting(true);
    setTestResult('');
    const res = await fetch('/api/admin/test-email', { method: 'POST' });
    const data = await res.json();
    setTesting(false);
    setTestResult(res.ok ? `Sent — check ${user?.email}.` : `Error: ${data.error}`);
  }

  if (loading || !user) return <AdminLayout user={user}><BrandLoader /></AdminLayout>;

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">YOUR ACCOUNT</div>
        <h1 className="portal-h1">Admin settings</h1>
        <p className="portal-sub">Update your login email and password here.</p>
      </div>

      <div className="portal-card">
        <h2 className="portal-h2">Email notifications (Gmail)</h2>
        <p className="portal-sub" style={{ marginTop: -2 }}>
          When configured, clients and team members automatically get an email — with the document attached —
          every time you send them something, plus a welcome email with their login details when you create their account.
        </p>

        {mailConfigured ? (
          <div className="portal-success">Connected — sending from your configured Gmail address.</div>
        ) : (
          <div className="portal-error">
            Not set up yet. In Vercel → Environment Variables, add <code>GMAIL_USER</code> (your Gmail address) and{' '}
            <code>GMAIL_APP_PASSWORD</code> (a 16-character App Password — generate one at{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#ff62c7' }}>
              myaccount.google.com/apppasswords
            </a>, requires 2-Step Verification enabled on that Google account first). Redeploy after adding them.
          </div>
        )}

        {mailConfigured && (
          <>
            {testResult && <div className={testResult.startsWith('Error') ? 'portal-error' : 'portal-success'}>{testResult}</div>}
            <button className="pill-btn" disabled={testing} onClick={sendTestEmail}>
              {testing ? 'Sending…' : 'Send test email to myself'}
            </button>
          </>
        )}
      </div>

      <AccountSettings profile={{ name: user.name, email: user.email }} onUpdated={() => {}} />
    </AdminLayout>
  );
}
