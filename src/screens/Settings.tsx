import { useSettings } from '../context/AppContext';
import './Settings.css';

export default function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <span className="eyebrow">Configuration</span>
        <h1 className="settings-title">Settings</h1>
      </header>

      <section className="lens settings-section" style={{ ['--i' as string]: 0 }}>
        <div className="lens-head">
          <h2 className="label">Appearance</h2>
        </div>
        <div className="settings-row">
          <span>Theme</span>
          <div className="settings-toggle-group" role="group" aria-label="Theme">
            <button
              type="button"
              className={`settings-toggle ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => void updateSettings({ theme: 'light' })}
              aria-pressed={settings.theme === 'light'}
            >
              Daylight
            </button>
            <button
              type="button"
              className={`settings-toggle ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => void updateSettings({ theme: 'dark' })}
              aria-pressed={settings.theme === 'dark'}
            >
              Deep
            </button>
          </div>
        </div>
      </section>

      <section className="lens settings-section" style={{ ['--i' as string]: 1 }}>
        <div className="lens-head">
          <h2 className="label">Notifications</h2>
        </div>
        <div className="settings-row">
          <span>Daily reminder notifications</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => void updateSettings({ notificationsEnabled: e.target.checked })}
            />
            <span className="settings-switch-track" aria-hidden="true" />
          </label>
        </div>
      </section>
    </div>
  );
}
