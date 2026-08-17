import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import AccountSettings from './AccountSettings';

export default function AdminAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !user) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Admin</span></div>
        <div className="portal-nav-actions">
          <Link className="pill-btn tiny" to="/admin">← All clients</Link>
          <span className="portal-user">{user.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="portal-container">
        <div className="portal-eyebrow">YOUR ACCOUNT</div>
        <h1 className="portal-h1">Admin settings</h1>
        <p className="portal-sub">Update your login email and password here.</p>
        <AccountSettings profile={{ name: user.name, email: user.email }} onUpdated={() => {}} />
      </div>
    </div>
  );
}
