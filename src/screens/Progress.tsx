import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { summarizeProgress } from '../utils/progress';
import { formatShortDate } from '../utils/date';
import ProgressRing from '../components/ProgressRing';
import AnimatedNumber from '../components/AnimatedNumber';
import './Progress.css';

export default function Progress() {
  const { commitments, dayRecords, dayRecordsFor } = useApp();
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');

  const scopedRecords = selectedId === 'all' ? dayRecords : dayRecordsFor(selectedId);
  const scopedSummary = useMemo(() => summarizeProgress(scopedRecords), [scopedRecords]);

  const recentDays = useMemo(() => {
    return [...scopedRecords].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [scopedRecords]);

  const maxSeconds = Math.max(1, ...recentDays.map((r) => r.targetSeconds));
  const complete = scopedSummary.completionPercent === 100;

  return (
    <div className="progress-screen">
      <header className="progress-header">
        <div className="progress-header-lead">
          <span className="eyebrow">Analysis</span>
          <h1 className="progress-title">Progress</h1>
        </div>
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
        <div className="panel ticked progress-ring-card">
          <div className="progress-rings">
            <div className="progress-ring-unit">
              <ProgressRing percent={scopedSummary.completionPercent} size={116} strokeWidth={8}
                color={complete ? 'var(--color-success)' : 'var(--color-accent)'} glow={complete}>
                <span className="progress-ring-value mono">
                  <AnimatedNumber value={scopedSummary.completionPercent} suffix="%" />
                </span>
                <span className="label label-faint">done</span>
              </ProgressRing>
              <span className="label progress-ring-caption">Completion</span>
            </div>
            <div className="progress-ring-unit">
              <ProgressRing percent={scopedSummary.consistencyPercent} size={116} strokeWidth={8} color="var(--color-accent-strong)">
                <span className="progress-ring-value mono">
                  <AnimatedNumber value={scopedSummary.consistencyPercent} suffix="%" />
                </span>
                <span className="label label-faint">kept</span>
              </ProgressRing>
              <span className="label progress-ring-caption">Consistency</span>
            </div>
          </div>
          <div className="progress-ring-sub label">
            {scopedSummary.completedDays} of {scopedSummary.totalPlanned} planned days complete
          </div>
        </div>

        <div className="panel progress-stat-list">
          <div className="panel-header">
            <span className="label">Breakdown</span>
          </div>
          <StatRow label="Total planned days" value={scopedSummary.totalPlanned} />
          <StatRow label="Completed" value={scopedSummary.completedDays} accent="success" />
          <StatRow label="Partial" value={scopedSummary.partialDays} accent="warning" />
          <StatRow label="Missed" value={scopedSummary.missedDays} accent="danger" />
        </div>
      </div>

      <section className="panel progress-chart-card">
        <div className="panel-header">
          <h2 className="label">Last 30 scheduled days</h2>
          <span className="label label-faint">recorded vs target</span>
        </div>
        <div className="progress-chart">
          {recentDays.length === 0 ? (
            <p className="progress-chart-empty">No scheduled days yet.</p>
          ) : (
            recentDays.map((record, idx) => {
              const heightPercent = Math.max(2, Math.min(100, (record.elapsedSeconds / maxSeconds) * 100));
              const barClass =
                record.status === 'DONE' ? 'bar-success' : record.elapsedSeconds > 0 ? 'bar-warning' : 'bar-neutral';
              return (
                <div
                  key={record.id}
                  className="progress-bar-col"
                  style={{ ['--i' as string]: idx }}
                  title={`${formatShortDate(record.date)} — ${record.status}`}
                >
                  <div className="progress-bar-track">
                    <div className={`progress-bar-fill ${barClass}`} style={{ height: `${heightPercent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="progress-chart-legend">
          <LegendKey cls="bar-success" label="Done" />
          <LegendKey cls="bar-warning" label="Partial" />
          <LegendKey cls="bar-neutral-key" label="None" />
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
  const numeric = typeof value === 'number';
  return (
    <div className="progress-stat-row">
      <span className={`progress-stat-dot ${accent ? `dot-${accent}` : ''}`} aria-hidden="true" />
      <span className="progress-stat-label">{label}</span>
      <span className="progress-stat-value mono">
        {numeric ? <AnimatedNumber value={value as number} /> : value}
      </span>
    </div>
  );
}

function LegendKey({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="progress-legend-key">
      <span className={`progress-legend-dot ${cls}`} aria-hidden="true" />
      {label}
    </span>
  );
}
