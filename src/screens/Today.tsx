import { memo, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useNowMs } from '../context/AppContext';
import { formatDuration, formatHoursMinutes, formatLongDate, todayISO } from '../utils/date';
import { cappedElapsedSeconds } from '../timer/engine';
import { computeDisplayStatus } from '../utils/status';
import { resolveTrackingType } from '../db/repository';
import StatusBadge from '../components/StatusBadge';
import FocusLens from '../components/FocusLens';
import AnimatedNumber from '../components/AnimatedNumber';
import { CheckIcon, CloseIcon, PauseIcon, PlayIcon, StopIcon } from '../components/icons';
import type { Commitment, DayRecord, DisplayStatus, TrackingType } from '../types';
import './Today.css';

interface TodayItem {
  commitment: Commitment;
  trackingType: TrackingType;
  record: DayRecord;
  status: DisplayStatus;
  liveElapsed: number;
  remaining: number;
  percent: number;
  isTimedHere: boolean;
}

export default function Today() {
  const {
    commitments,
    dayRecordFor,
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    toggleTodayCompletion,
    error,
    dismissError,
  } = useApp();
  const nowMs = useNowMs();
  const [actionError, setActionError] = useState<string | null>(null);
  const today = todayISO();

  const items = useMemo<TodayItem[]>(() => {
    return commitments
      .filter((c) => c.startDate <= today && today <= c.endDate)
      .map((c) => {
        const record = dayRecordFor(c.id, today);
        if (!record) return null;
        const trackingType = resolveTrackingType(c);
        const isTimedHere = timer?.commitmentId === c.id && timer.dayDate === today;
        const liveElapsed = isTimedHere && timer
          ? cappedElapsedSeconds(timer, record.targetSeconds, nowMs)
          : record.elapsedSeconds;
        const remaining = Math.max(0, record.targetSeconds - liveElapsed);
        const percent =
          trackingType === 'COMPLETION'
            ? record.status === 'DONE' ? 100 : 0
            : record.targetSeconds > 0 ? Math.min(100, (liveElapsed / record.targetSeconds) * 100) : 0;
        return {
          commitment: c,
          trackingType,
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

  const handleStart = useCallback(
    async (commitmentId: string) => {
      setActionError(null);
      try {
        await startTimer(commitmentId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not start the timer.');
      }
    },
    [startTimer],
  );

  const handleToggleComplete = useCallback(
    async (commitmentId: string) => {
      setActionError(null);
      try {
        await toggleTodayCompletion(commitmentId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not update this habit.');
      }
    },
    [toggleTodayCompletion],
  );

  // Stable object identity across ticks (all inputs are already useCallback
  // with stable deps) so memoized TodayCards below don't get invalidated by
  // a "new controls object" on every render — only real prop changes do.
  const controls = useMemo(
    () => ({ pauseTimer, resumeTimer, stopTimer, handleStart, handleToggleComplete }),
    [pauseTimer, resumeTimer, stopTimer, handleStart, handleToggleComplete],
  );

  return (
    <div className="today-screen">
      <header className="today-header">
        <div className="today-header-lead">
          <span className="eyebrow">{formatLongDate(today)}</span>
          <h1 className="today-title display">
            Today,<br />
            <em className="accent">find your clear current.</em>
          </h1>
        </div>
        {total > 0 && (
          <div className="today-header-meter">
            <div className="today-meter-num">
              <AnimatedNumber value={completedCount} /> / {total}
            </div>
            <span className="label">complete</span>
            <div className="today-meter-track" aria-hidden="true">
              <div className="today-meter-fill" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        )}
      </header>

      {(error || actionError) && (
        <div className="today-error lens" role="alert">
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
            {timer ? (
              <>
                <TodayGroup title="In progress" tone="progress" items={inProgress} controls={controls} timer={timer} />
                <TodayGroup title="Needs attention" tone="attention" items={needsAttention} controls={controls} timer={timer} />
              </>
            ) : (
              <>
                <TodayGroup title="Needs attention" tone="attention" items={needsAttention} controls={controls} timer={timer} />
                <TodayGroup title="In progress" tone="progress" items={inProgress} controls={controls} timer={timer} />
              </>
            )}
            <TodayGroup title="Complete" tone="complete" items={complete} controls={controls} timer={timer} collapsedMeta />
          </div>

          <aside className="today-context" aria-label="Daily status">
            <div className="lens today-status-card">
              <FocusLens percent={completionPercent} size={132} variant="round" state={completionPercent === 100 ? 'done' : 'idle'}>
                <span className="today-status-percent">
                  <AnimatedNumber value={completionPercent} suffix="%" />
                </span>
                <span className="label">of today</span>
              </FocusLens>
              <div className="today-status-caption">
                {completedCount} of {total} commitments complete
              </div>
            </div>
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
  handleToggleComplete: (id: string) => Promise<void>;
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
        <h2 className="today-group-title label">{title}</h2>
        <span className="today-group-count">{items.length}</span>
        <span className="today-group-rule" aria-hidden="true" />
      </div>
      <div className="today-trail stagger">
        {items.map((item, idx) => (
          <TodayCard key={item.commitment.id} item={item} controls={controls} timer={timer} index={idx} compact={collapsedMeta} />
        ))}
      </div>
    </section>
  );
}

interface TodayCardProps {
  item: TodayItem;
  controls: Controls;
  timer: ReturnType<typeof useApp>['timer'];
  index: number;
  compact?: boolean;
}

/**
 * `items` is rebuilt with a fresh array + fresh per-row objects every render
 * of Today() (it must be, to recompute the running timer's live elapsed
 * seconds each tick) — so a plain reference check would re-render every
 * visible card every second even though most of them show unchanged data.
 * This comparator instead checks the actual values that affect a card's
 * rendered output, so cards unrelated to whichever commitment is currently
 * timed skip re-rendering entirely while the clock ticks.
 */
function todayCardPropsEqual(prev: TodayCardProps, next: TodayCardProps): boolean {
  if (prev.controls !== next.controls || prev.timer !== next.timer || prev.index !== next.index || prev.compact !== next.compact) {
    return false;
  }
  const a = prev.item;
  const b = next.item;
  return (
    a.commitment === b.commitment &&
    a.record === b.record &&
    a.trackingType === b.trackingType &&
    a.status === b.status &&
    a.liveElapsed === b.liveElapsed &&
    a.remaining === b.remaining &&
    a.percent === b.percent &&
    a.isTimedHere === b.isTimedHere
  );
}

const TodayCard = memo(function TodayCard({ item, controls, timer, index, compact }: TodayCardProps) {
  const { commitment, trackingType, record, status, liveElapsed, remaining, percent, isTimedHere } = item;
  const isCompletion = trackingType === 'COMPLETION';
  const anotherTimerRunning = !!timer && !isTimedHere;
  const done = status === 'DONE' || status === 'COMPLETED_LATE';
  const lensState = done ? 'done' : isTimedHere && timer?.status === 'running' ? 'running' : 'idle';

  return (
    <div
      className={`today-card lens tone-${done ? 'complete' : isTimedHere ? 'progress' : 'attention'}`}
      style={{ ['--i' as string]: index }}
    >
      <div className="today-card-lens">
        {isCompletion ? (
          <span className={`today-card-check${done ? ' done' : ''}`} aria-hidden="true">
            <CheckIcon width={20} height={20} />
          </span>
        ) : (
          <FocusLens percent={percent} size={52} variant="drop" state={lensState}>
            <span className="today-card-lens-num">{Math.round(percent)}</span>
          </FocusLens>
        )}
      </div>

      <div className="today-card-main">
        <div className="today-card-head">
          <Link to={`/commitments/${commitment.id}`} className="today-card-name serif">
            {commitment.name}
          </Link>
          <StatusBadge status={status} />
        </div>

        {!isCompletion && (
          <div className="today-card-meta">
            <span>Target <b className="mono">{formatHoursMinutes(record.targetSeconds)}</b></span>
            <span className="today-card-dot" aria-hidden="true" />
            <span>Elapsed <b className="mono">{formatDuration(liveElapsed)}</b></span>
            {!done && (
              <>
                <span className="today-card-dot" aria-hidden="true" />
                <span>Left <b className="mono">{formatDuration(remaining)}</b></span>
              </>
            )}
          </div>
        )}

        {!isCompletion && !compact && (
          <div
            className="today-fluid-track"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${commitment.name} progress`}
          >
            <div className={`today-fluid-fill${done ? ' done' : ''}`} style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      <div className="today-card-buttons">
        {isCompletion ? (
          done ? (
            <button
              type="button"
              className="btn btn-ghost today-btn-sm today-btn-completed"
              onClick={() => void controls.handleToggleComplete(commitment.id)}
            >
              <CheckIcon width={13} height={13} /> Completed
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary today-btn-sm"
              onClick={() => void controls.handleToggleComplete(commitment.id)}
            >
              <CheckIcon width={13} height={13} /> Complete
            </button>
          )
        ) : done ? (
          <Link to="/progress" className="btn btn-ghost today-btn-sm">
            Progress
          </Link>
        ) : isTimedHere && timer?.status === 'running' ? (
          <>
            <button type="button" className="btn btn-ghost today-btn-sm" onClick={() => void controls.pauseTimer()}>
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
            title={anotherTimerRunning ? 'Stop the active current first' : undefined}
          >
            <PlayIcon width={13} height={13} /> Start
          </button>
        )}
        {!isCompletion && isTimedHere && (
          <Link to="/timer" className="btn btn-ghost today-btn-sm">
            Lens
          </Link>
        )}
      </div>
    </div>
  );
}, todayCardPropsEqual);

function TodayEmpty() {
  const steps = [
    { k: 'Plan', d: 'Define a commitment and a daily target.' },
    { k: 'Execute', d: 'Run the lens and do the work.' },
    { k: 'Record', d: 'Time is logged automatically, every day.' },
    { k: 'Repeat', d: 'Return tomorrow. Consistency compounds.' },
  ];
  return (
    <div className="today-empty">
      <div className="lens today-empty-panel">
        <div className="today-empty-head">
          <span className="eyebrow">Still water</span>
          <h2 className="today-empty-title display">
            The surface is <em className="accent">calm.</em>
          </h2>
          <p className="today-empty-copy">
            GRIT moves on a single current. Set your first commitment and the day begins to
            fill with something you can measure.
          </p>
          <Link to="/new-commitment" className="btn btn-primary today-empty-cta">
            New commitment
          </Link>
        </div>
        <ol className="today-empty-loop">
          {steps.map((s, i) => (
            <li key={s.k} className="today-empty-step" style={{ ['--i' as string]: i }}>
              <span className="today-empty-step-drop" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="today-empty-step-k serif">{s.k}</div>
                <div className="today-empty-step-d">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
