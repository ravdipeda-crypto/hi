import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import './Settings.css';

export default function Settings() {
  const { settings, updateSettings, exportData, importData, resetAllData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetPhraseInput, setResetPhraseInput] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function handleExport() {
    try {
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-architect-export-${payload.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ kind: 'success', text: 'Export downloaded.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Export failed.' });
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importData(parsed);
      setMessage({ kind: 'success', text: 'Data imported successfully.' });
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'This file could not be imported. It may be corrupted or in the wrong format.',
      });
    }
  }

  async function handleReset() {
    await resetAllData();
    setConfirmingReset(false);
    setResetPhraseInput('');
    setMessage({ kind: 'success', text: 'All commitment data has been permanently deleted.' });
  }

  return (
    <div className="settings-screen">
      <h1 className="settings-title">Settings</h1>

      {message && (
        <div className={`panel settings-message ${message.kind === 'error' ? 'settings-message-error' : ''}`} role="status">
          {message.text}
        </div>
      )}

      <section className="panel settings-section">
        <div className="panel-header">
          <h2 className="label">Appearance</h2>
        </div>
        <div className="settings-row">
          <span>Theme</span>
          <div className="settings-toggle-group" role="group" aria-label="Theme">
            <button
              type="button"
              className={`settings-toggle ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => void updateSettings({ theme: 'dark' })}
              aria-pressed={settings.theme === 'dark'}
            >
              Dark
            </button>
            <button
              type="button"
              className={`settings-toggle ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => void updateSettings({ theme: 'light' })}
              aria-pressed={settings.theme === 'light'}
            >
              Light
            </button>
          </div>
        </div>
      </section>

      <section className="panel settings-section">
        <div className="panel-header">
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

      <section className="panel settings-section">
        <div className="panel-header">
          <h2 className="label">Data &amp; Export</h2>
        </div>
        <div className="settings-row">
          <span>Export all data as JSON</span>
          <button type="button" className="btn" onClick={() => void handleExport()}>
            Export Data
          </button>
        </div>
        <div className="settings-row">
          <span>Import data from a file</span>
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <section className="panel settings-section settings-danger">
        <div className="panel-header">
          <h2 className="label">Reset</h2>
        </div>
        <div className="settings-row">
          <span>Permanently delete all commitments and history</span>
          {!confirmingReset && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingReset(true)}>
              Reset All Data
            </button>
          )}
        </div>

        {confirmingReset && (
          <div className="settings-reset-confirm">
            <p>
              This will permanently delete every commitment, day record, and the active timer. This
              cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={resetPhraseInput}
              onChange={(e) => setResetPhraseInput(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm reset"
            />
            <div className="settings-reset-actions">
              <button
                type="button"
                className="btn btn-danger"
                disabled={resetPhraseInput !== 'DELETE'}
                onClick={() => void handleReset()}
              >
                Confirm Permanent Delete
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setConfirmingReset(false);
                  setResetPhraseInput('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
