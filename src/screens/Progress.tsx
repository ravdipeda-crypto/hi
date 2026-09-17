import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { summarizeProgress } from '../utils/progress';
import ProgressRing from '../components/ProgressRing';
import './Progress.css';

export default function Progress() {
  const { commitments, dayRecords, dayRecordsFor } = useApp();
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');

  const scopedRecords = selectedId === 'all' ? dayRecords : dayRecordsFor(selectedId);
  const scopedSummary = useMemo(() => summarizeProgress(scopedRecords), [scopedRecords]);

  const recentDays = useMemo(() => {
    return [...scopedRecords]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [scopedRecords]);

  const maxSeconds = Math.max(1, ...recentDays.map((r) => r.targetSeconds));

  return (
    <div className="progress-screen">
      <header className="progress-header">
        <h1 className="progress-title">Progress</h1>
        <select
          className="progress-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          aria-label="Filter by commitment"
        >
          <option value="all">Overall Progress</option>
          {commitments.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </header>

      <div className="progress-top-grid">
        <div className="panel progress-ring-card">
          <ProgressRing percent={scopedSummary.completionPercent} size={120} strokeWidth={9}>
            <span className="progress-ring-value mono">{scopedSummary.completionPercent}%</span>
            <span className="label">Completion</span>
          </ProgressRing>
          <div className="progress-ring-sub label">
            {scopedSummary.completedDays} / {scopedSummary.totalPlanned} days
          </div>
        </div>

        <div className="panel progress-stat-list">
          <StatRow label="Total Planned Days" value={scopedSummary.totalPlanned} />
          <StatRow label="Completed" value={scopedSummary.completedDays} accent="success" />
          <StatRow label="Partial" value={scopedSummary.partialDays} accent="warning" />
          <StatRow label="Missed" value={scopedSummary.missedDays} accent="danger" />
          <StatRow label="Consistency" value={`${scopedSummary.consistencyPercent}%`} />
        </div>
      </div>

      <section className="panel progress-chart-card">
        <div className="panel-header">
          <h2 className="label">Last 30 Scheduled Days</h2>
        </div>
        <div className="progress-chart">
          {recentDays.length === 0 ? (
            <p className="progress-chart-empty">No scheduled days yet.</p>
          ) : (
            recentDays.map((record) => {
              const heightPercent = Math.min(100, (record.elapsedSeconds / maxSeconds) * 100);
              const barClass =
                record.status === 'DONE'
                  ? 'bar-success'
                  : record.elapsedSeconds > 0
                  ? 'bar-warning'
                  : 'bar-neutral';
              return (
                <div key={record.id} className="progress-bar-col" title={`${record.date}`}>
                  <div className="progress-bar-track">
                    <div className={`progress-bar-fill ${barClass}`} style={{ height: `${heightPercent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="progress-stat-row">
      <span className={`progress-stat-dot ${accent ? `dot-${accent}` : ''}`} aria-hidden="true" />
      <span className="progress-stat-label">{label}</span>
      <span className="progress-stat-value mono">{value}</span>
    </div>
  );
}
