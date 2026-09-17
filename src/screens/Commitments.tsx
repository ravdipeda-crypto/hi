import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatHoursMinutes, formatShortDate, todayISO } from '../utils/date';
import { summarizeProgress, type ProgressSummary } from '../utils/progress';
import AnimatedNumber from '../components/AnimatedNumber';
import { ArrowRightIcon } from '../components/icons';
import type { Commitment } from '../types';
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
        <div className="commitments-header-lead">
          <span className="eyebrow">Registry</span>
          <h1 className="commitments-title display">
            Every <span className="accent">promise</span> you keep
          </h1>
        </div>
        <Link to="/new-commitment" className="btn btn-primary">
          <span>New Commitment</span>
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </header>

      <Section title="Active" count={active.length} rows={active} tone="active" emptyLabel="No active commitments." />
      <Section title="Completed" count={completed.length} rows={completed} tone="complete" emptyLabel="No completed commitments yet." />
    </div>
  );
}

function Section({
  title,
  count,
  rows,
  tone,
  emptyLabel,
}: {
  title: string;
  count: number;
  tone: 'active' | 'complete';
  rows: { commitment: Commitment; summary: ProgressSummary }[];
  emptyLabel: string;
}) {
  return (
    <section className="commitments-section">
      <div className={`commitments-section-head tone-${tone}`}>
        <h2 className="label commitments-section-title">{title}</h2>
        <span className="commitments-section-count mono">{count}</span>
        <span className="commitments-section-rule" aria-hidden="true" />
      </div>
      {rows.length === 0 ? (
        <div className="lens commitments-empty">{emptyLabel}</div>
      ) : (
        <div className="commitments-list stagger">
          {rows.map(({ commitment, summary }, idx) => (
            <Link
              key={commitment.id}
              to={`/commitments/${commitment.id}`}
              className={`lens commitment-row tone-${tone}`}
              style={{ ['--i' as string]: idx }}
            >
              <div className="commitment-row-main">
                <div className="commitment-row-name serif">{commitment.name}</div>
                <div className="commitment-row-meta">
                  {formatHoursMinutes(commitment.dailyTargetSeconds)} / day · {commitment.durationDays} days ·{' '}
                  {formatShortDate(commitment.startDate)} – {formatShortDate(commitment.endDate)}
                </div>
                <div className="commitment-row-track" aria-hidden="true">
                  <div
                    className={`commitment-row-fill${summary.completionPercent === 100 ? ' full' : ''}`}
                    style={{ width: `${summary.completionPercent}%` }}
                  />
                </div>
              </div>
              <div className="commitment-row-progress">
                <div className="commitment-row-percent mono">
                  <AnimatedNumber value={summary.completionPercent} suffix="%" />
                </div>
                <div className="label commitment-row-days">
                  {summary.completedDays} / {summary.totalPlanned} days
                </div>
              </div>
              <span className="commitment-row-chevron" aria-hidden="true">
                <ArrowRightIcon width={16} height={16} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
