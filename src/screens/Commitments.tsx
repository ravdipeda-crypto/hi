import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatHoursMinutes, formatShortDate, todayISO } from '../utils/date';
import { summarizeProgress } from '../utils/progress';
import './Commitments.css';

export default function Commitments() {
  const { commitments, dayRecordsFor } = useApp();
  const today = todayISO();

  const rows = useMemo(
    () =>
      commitments.map((commitment) => {
        const records = dayRecordsFor(commitment.id);
        const summary = summarizeProgress(records);
        const isActive = commitment.endDate >= today;
        return { commitment, summary, isActive };
      }),
    [commitments, dayRecordsFor, today],
  );

  const active = rows.filter((r) => r.isActive);
  const completed = rows.filter((r) => !r.isActive);

  return (
    <div className="commitments-screen">
      <header className="commitments-header">
        <h1 className="commitments-title">Commitments</h1>
        <Link to="/new-commitment" className="btn btn-primary">
          New Commitment
        </Link>
      </header>

      <Section title={`Active (${active.length})`} rows={active} emptyLabel="No active commitments." />
      <Section title={`Completed (${completed.length})`} rows={completed} emptyLabel="No completed commitments yet." />
    </div>
  );
}

function Section({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: { commitment: import('../types').Commitment; summary: import('../utils/progress').ProgressSummary }[];
  emptyLabel: string;
}) {
  return (
    <section className="commitments-section">
      <h2 className="label commitments-section-title">{title}</h2>
      {rows.length === 0 ? (
        <div className="panel commitments-empty">{emptyLabel}</div>
      ) : (
        <div className="commitments-list">
          {rows.map(({ commitment, summary }) => (
            <Link key={commitment.id} to={`/commitments/${commitment.id}`} className="panel commitment-row">
              <div className="commitment-row-main">
                <div className="commitment-row-name">{commitment.name}</div>
                <div className="commitment-row-meta label">
                  {formatHoursMinutes(commitment.dailyTargetSeconds)} / day · {commitment.durationDays} days ·{' '}
                  {formatShortDate(commitment.startDate)} – {formatShortDate(commitment.endDate)}
                </div>
              </div>
              <div className="commitment-row-progress">
                <div className="commitment-row-percent mono">{summary.completionPercent}%</div>
                <div className="commitment-row-track">
                  <div className="commitment-row-fill" style={{ width: `${summary.completionPercent}%` }} />
                </div>
                <div className="label commitment-row-days">
                  {summary.completedDays} / {summary.totalPlanned} days
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
