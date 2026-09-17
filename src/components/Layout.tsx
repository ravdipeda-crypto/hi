import { NavLink, Outlet } from 'react-router-dom';
import { CommitmentsIcon, ProgressIcon, SettingsIcon, TodayIcon, TriangleMark } from './icons';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/commitments', label: 'Commitments', Icon: CommitmentsIcon },
  { to: '/progress', label: 'Progress', Icon: ProgressIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">
          <span className="sidebar-mark">
            <TriangleMark width={22} height={22} />
          </span>
          <div>
            <div className="sidebar-title wordmark">THE ARCHITECT</div>
            <div className="sidebar-subtitle label">Build a better you</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-glyph">
                <item.Icon />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer label">Plan · Execute · Repeat</div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          >
            <item.Icon width={18} height={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
