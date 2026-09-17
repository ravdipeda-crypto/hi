import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDuration, formatHoursMinutes, formatLongDate, todayISO } from '../utils/date';
import { cappedElapsedSeconds } from '../timer/engine';
import { computeDisplayStatus } from '../utils/status';
import StatusBadge from '../components/StatusBadge';
import ProgressRing from '../components/ProgressRing';
import AnimatedNumber from '../components/AnimatedNumber';
import { ArrowRightIcon, CloseIcon, PauseIcon, PlayIcon, StopIcon } from '../components/icons';
import type { Commitment, DayRecord, DisplayStatus } from '../types';
import './Today.css';

interface TodayItem {
  commitment: Commitment;
  record: DayRecord;
  status: DisplayStatus;
  liveElapsed: number;
  remaining: number;
  percent: number;
  isTimedHere: boolean;
}

export default function Today() {
  const { commitments, dayRecordFor, timer, nowMs, startTimer, pauseTimer, resumeTimer, stopTimer, error, dismissError } =
    useApp();
  const [actionError, setActionError] = useState<string | null>(null);
  const today = todayISO();

  const items = useMemo<TodayItem[]>(() => {
    return commitments
      .filter((c) => c.startDate <= today && today <= c.endDate)
      .map((c) => {
        const record = dayRecordFor(c.id, today);
        if (!record) return null;
        const isTimedHere = timer?.commitmentId === c.id && timer.dayDate === today;
        const liveElapsed = isTimedHere && timer
          ? cappedElapsedSeconds(timer, record.targetSeconds, nowMs)
          : record.elapsedSeconds;
        const remaining = Math.max(0, record.targetSeconds - liveElapsed);
        const percent = record.targetSeconds > 0 ? Math.min(100, (liveElapsed / record.targetSeconds) * 100) : 0;
        return {
          commitment: c,
          record,
          status: computeDisplayStatus(record, timer),
          liveElapsed,
          remaining,
          percent,
          isTimedHere,
        };
      })
      .filter((v): v is TodayItem => v !== null);
  }, [commitments, dayRecordFor, today, timer, nowMs]);

  // Operational grouping: what needs attention -> what is in progress -> what is complete.
  const complete = items.filter((i) => i.status === 'DONE' || i.status === 'COMPLETED_LATE');
  const inProgress = items.filter((i) => i.isTimedHere && i.status !== 'DONE' && i.status !== 'COMPLETED_LATE');
  const needsAttention = items.filter(
    (i) => !i.isTimedHere && i.status !== 'DONE' && i.status !== 'COMPLETED_LATE',
  );

  const total = items.length;
  const completedCount = complete.length;
  const completionPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const plannedSeconds = items.reduce((sum, i) => sum + i.record.targetSeconds, 0);
  const recordedSeconds = items.reduce((sum, i) => sum + i.liveElapsed, 0);
  const activeItem = items.find((i) => i.isTimedHere) ?? null;

  async function handleStart(commitmentId: string) {
    setActionError(null);
    try {
      await startTimer(commitmentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start the timer.');
    }
  }

  const controls = { pauseTimer, resumeTimer, stopTimer, handleStart };

  return (
    <div className="today-screen">
      <header className="today-header">
        <div className="today-header-lead">
          <span className="eyebrow">Operations</span>
          <h1 className="today-title">Today</h1>
          <p className="today-date label">{formatLongDate(today)}</p>
        </div>
        {total > 0 && (
          <div className="today-header-meter">
            <div className="today-meter-track" aria-hidden="true">
              <div className="today-meter-fill" style={{ width: `${completionPercent}%` }} />
            </div>
            <span className="label">
              <AnimatedNumber value={completedCount} /> / {total} complete
            </span>
          </div>
        )}
      </header>

      {(error || actionError) && (
        <div className="today-error panel" role="alert">
          <span>{actionError ?? error}</span>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => {
              setActionError(null);
              dismissError();
            }}
            aria-label="Dismiss error"
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      )}

      {total === 0 ? (
        <TodayEmpty />
      ) : (
        <div className="today-layout">
          <div className="today-main">
            <TodayGroup title="Needs attention" tone="attention" items={needsAttention} controls={controls} timer={timer} />
            <TodayGroup title="In progress" tone="progress" items={inProgress} controls={controls} timer={timer} />
            <TodayGroup title="Complete" tone="complete" items={complete} controls={controls} timer={timer} collapsedMeta />
          </div>

          <aside className="today-context" aria-label="Daily status">
            <div className="panel ticked today-status-card">
              <div className="today-status-ring">
                <ProgressRing percent={completionPercent} size={104} strokeWidth={7} glow={completionPercent === 100}
                  color={completionPercent === 100 ? 'var(--color-success)' : 'var(--color-accent)'}>
                  <span className="today-status-percent mono">
                    <AnimatedNumber value={completionPercent} suffix="%" />
                  </span>
                  <span className="label label-faint">day</span>
                </ProgressRing>
              </div>
              <div className="today-status-caption label">
                {completedCount} of {total} commitments complete
              </div>
            </div>

            <div className="panel today-stat-panel">
              <div className="panel-header">
                <span className="label">Ledger</span>
                <span className="label label-faint mono">{formatLongDate(today).split(',')[0]}</span>
              </div>
              <StatLine label="Scheduled" value={String(total)} />
              <StatLine label="Remaining" value={String(total - completedCount)} tone={total - completedCount > 0 ? 'accent' : undefined} />
              <StatLine label="Planned time" value={formatHoursMinutes(plannedSeconds)} />
              <StatLine label="Recorded today" value={formatDuration(recordedSeconds)} mono />
            </div>

            {activeItem && (
              <Link to="/timer" className="panel today-session-card">
                <div className="today-session-head">
                  <span className={`today-session-dot${timer?.status === 'running' ? ' live' : ''}`} aria-hidden="true" />
                  <span className="label">{timer?.status === 'running' ? 'Session running' : 'Session paused'}</span>
                </div>
                <div className="today-session-name">{activeItem.commitment.name}</div>
                <div className="today-session-time mono">
                  {formatDuration(activeItem.liveElapsed)} <span className="label-faint">/ {formatHoursMinutes(activeItem.record.targetSeconds)}</span>
                </div>
                <div className="today-session-open label">
                  Open timer <ArrowRightIcon width={12} height={12} />
                </div>
              </Link>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

interface Controls {
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  handleStart: (id: string) => Promise<void>;
}

function TodayGroup({
  title,
  tone,
  items,
  controls,
  timer,
  collapsedMeta,
}: {
  title: string;
  tone: 'attention' | 'progress' | 'complete';
  items: TodayItem[];
  controls: Controls;
  timer: ReturnType<typeof useApp>['timer'];
  collapsedMeta?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="today-group">
      <div className={`today-group-head tone-${tone}`}>
        <span className="today-group-marker" aria-hidden="true" />
        <h2 className="today-group-title label">{title}</h2>
        <span className="today-group-count mono">{items.length}</span>
      </div>
      <div className="today-list stagger">
        {items.map((item, idx) => (
          <TodayCard key={item.commitment.id} item={item} controls={controls} timer={timer} index={idx} compact={collapsedMeta} />
        ))}
      </div>
    </section>
  );
}

function TodayCard({
  item,
  controls,
  timer,
  index,
  compact,
}: {
  item: TodayItem;
  controls: Controls;
  timer: ReturnType<typeof useApp>['timer'];
  index: number;
  compact?: boolean;
}) {
  const { commitment, record, status, liveElapsed, remaining, percent, isTimedHere } = item;
  const anotherTimerRunning = !!timer && !isTimedHere;
  const done = status === 'DONE' || status === 'COMPLETED_LATE';

  return (
    <div
      className={`today-card panel tone-${done ? 'complete' : isTimedHere ? 'progress' : 'attention'}`}
      style={{ ['--i' as string]: index }}
    >
      <span className="today-card-rule" aria-hidden="true" />
      <div className="today-card-main">
        <div className="today-card-head">
          <Link to={`/commitments/${commitment.id}`} className="today-card-name">
            {commitment.name}
          </Link>
          <StatusBadge status={status} />
        </div>

        <div className="today-card-meta">
          <span className="label">Target</span>
          <span className="mono">{formatHoursMinutes(record.targetSeconds)}</span>
          <span className="today-card-sep" aria-hidden="true" />
          <span className="label">Elapsed</span>
          <span className="mono">{formatDuration(liveElapsed)}</span>
          {!done && (
            <>
              <span className="today-card-sep" aria-hidden="true" />
              <span className="label">Left</span>
              <span className="mono">{formatDuration(remaining)}</span>
            </>
          )}
        </div>

        {!compact && (
          <div
            className="today-progress-track"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${commitment.name} progress`}
          >
            <div className={`today-progress-fill${done ? ' done' : ''}`} style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      <div className="today-card-controls">
        <ProgressRing percent={percent} size={58} strokeWidth={4}
          color={done ? 'var(--color-success)' : 'var(--color-accent)'} glow={isTimedHere && timer?.status === 'running'}>
          <span className="mono today-ring-value">{Math.round(percent)}</span>
        </ProgressRing>

        <div className="today-card-buttons">
          {done ? (
            <Link to="/progress" className="btn today-btn-sm">
              Progress
            </Link>
          ) : isTimedHere && timer?.status === 'running' ? (
            <>
              <button type="button" className="btn today-btn-sm" onClick={() => void controls.pauseTimer()}>
                <PauseIcon width={13} height={13} /> Pause
              </button>
              <button type="button" className="btn btn-danger today-btn-sm" onClick={() => void controls.stopTimer()}>
                <StopIcon width={13} height={13} /> Stop
              </button>
            </>
          ) : isTimedHere && timer?.status === 'paused' ? (
            <>
              <button type="button" className="btn btn-primary today-btn-sm" onClick={() => void controls.resumeTimer()}>
                <PlayIcon width={13} height={13} /> Resume
              </button>
              <button type="button" className="btn btn-danger today-btn-sm" onClick={() => void controls.stopTimer()}>
                <StopIcon width={13} height={13} /> Stop
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary today-btn-sm"
              onClick={() => void controls.handleStart(commitment.id)}
              disabled={anotherTimerRunning}
              title={anotherTimerRunning ? 'Stop the active timer first' : undefined}
            >
              <PlayIcon width={13} height={13} /> Start
            </button>
          )}
          {isTimedHere && (
            <Link to="/timer" className="btn today-btn-sm">
              Timer
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, value, tone, mono }: { label: string; value: string; tone?: 'accent'; mono?: boolean }) {
  return (
    <div className="today-statline">
      <span className="label">{label}</span>
      <span className={`today-statline-value${tone === 'accent' ? ' accent' : ''}${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}

function TodayEmpty() {
  const steps = [
    { k: 'Plan', d: 'Define a commitment and a daily target.' },
    { k: 'Execute', d: 'Run the timer and do the work.' },
    { k: 'Record', d: 'Time is logged automatically, every day.' },
    { k: 'Repeat', d: 'Show up tomorrow. Consistency compounds.' },
  ];
  return (
    <div className="today-empty">
      <div className="panel ticked today-empty-panel">
        <div className="today-empty-head">
          <span className="eyebrow">No commitments scheduled</span>
          <h2 className="today-empty-title">The board is clear.</h2>
          <p className="today-empty-copy">
            THE ARCHITECT works on a single loop. Set your first commitment and the day begins to fill
            with something you can measure.
          </p>
          <Link to="/new-commitment" className="btn btn-primary today-empty-cta">
            New Commitment
          </Link>
        </div>
        <ol className="today-empty-loop">
          {steps.map((s, i) => (
            <li key={s.k} className="today-empty-step" style={{ ['--i' as string]: i }}>
              <span className="today-empty-step-index mono">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="today-empty-step-k">{s.k}</div>
                <div className="today-empty-step-d">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
