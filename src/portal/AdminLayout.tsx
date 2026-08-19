import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Star } from 'lucide-react';
import { logout, Me } from './api';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin', label: 'Clients', icon: Users, end: true },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/account', label: 'Account', icon: Settings },
];

export default function AdminLayout({ user, children }: { user: Me | null; children: ReactNode }) {
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">ASH<span>ES</span></div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">{(user?.name || '?').charAt(0).toUpperCase()}</div>
            <div>
              <div className="admin-sidebar-username">{user?.name}</div>
              <div className="admin-sidebar-userrole">Admin</div>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={onLogout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
