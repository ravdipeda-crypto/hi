import { NavLink, Outlet } from 'react-router-dom';
import { CommitmentsIcon, ProgressIcon, SettingsIcon, TodayIcon, TriangleMark } from './icons';
import RouteTransition from './RouteTransition';
import { useApp } from '../context/AppContext';
import { formatShortDate, todayISO } from '../utils/date';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/today', label: 'Today', Icon: TodayIcon, index: '01' },
  { to: '/commitments', label: 'Commitments', Icon: CommitmentsIcon, index: '02' },
  { to: '/progress', label: 'Progress', Icon: ProgressIcon, index: '03' },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, index: '04' },
];

export default function Layout() {
  const { timer, commitments } = useApp();
  const activeCount = commitments.filter((c) => c.endDate >= todayISO()).length;

  return (
    <div className="app-shell">
      {/* Compact brand rail — mobile only */}
      <header className="mobile-topbar">
        <span className="mobile-topbar-mark">
          <TriangleMark width={18} height={18} />
        </span>
        <span className="mobile-topbar-title wordmark">THE ARCHITECT</span>
        <span className={`mobile-topbar-status label${timer ? ' live' : ''}`}>
          {timer ? (timer.status === 'running' ? 'REC' : 'HOLD') : formatShortDate(todayISO())}
        </span>
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand">
          <span className="sidebar-mark">
            <TriangleMark width={24} height={24} />
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
              <span className="sidebar-link-bar" aria-hidden="true" />
              <span className="sidebar-link-glyph">
                <item.Icon />
              </span>
              <span className="sidebar-link-label">{item.label}</span>
              <span className="sidebar-link-index mono" aria-hidden="true">
                {item.index}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className={`sidebar-status-dot${timer ? ' live' : ''}`} aria-hidden="true" />
            <span className="label">
              {timer ? (timer.status === 'running' ? 'Timer running' : 'Timer paused') : 'System idle'}
            </span>
          </div>
          <div className="sidebar-meta label label-faint">
            <span>{activeCount} active</span>
            <span aria-hidden="true">·</span>
            <span>Plan · Execute · Repeat</span>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <RouteTransition>
          <Outlet />
        </RouteTransition>
      </main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          >
            <span className="mobile-nav-bar" aria-hidden="true" />
            <item.Icon width={19} height={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
