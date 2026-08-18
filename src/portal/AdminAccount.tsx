import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import AccountSettings from './AccountSettings';
import AshesLoader from './AshesLoader';

export default function AdminAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((u) => {
      if (!u) return navigate('/login');
      if (u.role !== 'admin') return navigate(u.role === 'team' ? '/team' : '/portal');
      setUser(u);
      setLoading(false);
    });
  }, [navigate]);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !user) return <AshesLoader label="Opening owner settings…" />;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Owner</span></div>
        <div className="portal-nav-actions">
          <Link className="pill-btn tiny" to="/admin/dashboard">Dashboard</Link>
          <Link className="pill-btn tiny" to="/admin">Clients &amp; team</Link>
          <span className="portal-user">{user.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="portal-container">
        <div className="portal-eyebrow">OWNER ACCOUNT</div>
        <h1 className="portal-h1">Account &amp; security</h1>
        <p className="portal-sub">Update your owner login email and password here.</p>
        <AccountSettings profile={{ name: user.name, email: user.email }} onUpdated={() => {}} />
      </div>
    </div>
  );
}
