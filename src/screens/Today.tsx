import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDuration, formatHoursMinutes, formatLongDate, todayISO } from '../utils/date';
import { cappedElapsedSeconds } from '../timer/engine';
import { computeDisplayStatus } from '../utils/status';
import StatusBadge from '../components/StatusBadge';
import ProgressRing from '../components/ProgressRing';
import { CloseIcon } from '../components/icons';
import type { Commitment, DayRecord } from '../types';
import './Today.css';

export default function Today() {
  const { commitments, dayRecordFor, timer, nowMs, startTimer, pauseTimer, resumeTimer, stopTimer, error, dismissError } =
    useApp();
  const [actionError, setActionError] = useState<string | null>(null);
  const today = todayISO();

  const todaysItems = useMemo(() => {
    return commitments
      .filter((c) => c.startDate <= today && today <= c.endDate)
      .map((c) => ({ commitment: c, record: dayRecordFor(c.id, today) }))
      .filter((item): item is { commitment: Commitment; record: DayRecord } => !!item.record);
  }, [commitments, dayRecordFor, today]);

  const completedCount = todaysItems.filter((item) => item.record.status === 'DONE').length;

  async function handleStart(commitmentId: string) {
    setActionError(null);
    try {
      await startTimer(commitmentId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not start the timer.');
    }
  }

  return (
    <div className="today-screen">
      <header className="today-header">
        <div>
          <p className="label">{formatLongDate(today)}</p>
          <h1 className="today-title">Today</h1>
        </div>
        <div className="today-summary label">
          {completedCount} / {todaysItems.length} completed
        </div>
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

      {todaysItems.length === 0 ? (
        <div className="panel today-empty">
          <p>No commitments are scheduled for today.</p>
          <Link to="/new-commitment" className="btn btn-primary">
            New Commitment
          </Link>
        </div>
      ) : (
        <div className="today-list">
          {todaysItems.map(({ commitment, record }) => {
            const isTimedHere = timer?.commitmentId === commitment.id && timer.dayDate === today;
            const liveElapsed = isTimedHere && timer
              ? cappedElapsedSeconds(timer, record.targetSeconds, nowMs)
              : record.elapsedSeconds;
            const remaining = Math.max(0, record.targetSeconds - liveElapsed);
            const percent = record.targetSeconds > 0 ? Math.min(100, (liveElapsed / record.targetSeconds) * 100) : 0;
            const status = computeDisplayStatus(record, timer);
            const anotherTimerRunning = !!timer && !isTimedHere;

            return (
              <div key={commitment.id} className="today-card panel">
                <div className="today-card-main">
                  <div className="today-card-head">
                    <Link to={`/commitments/${commitment.id}`} className="today-card-name">
                      {commitment.name}
                    </Link>
                    <StatusBadge status={status} />
                  </div>

                  <div className="today-card-meta label">
                    Target {formatHoursMinutes(record.targetSeconds)} · {formatDuration(liveElapsed)} elapsed ·{' '}
                    {formatDuration(remaining)} remaining
                  </div>

                  <div className="today-progress-track" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="today-progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="today-card-controls">
                  <ProgressRing percent={percent} size={64} strokeWidth={5}>
                    <span className="mono today-ring-value">{Math.round(percent)}%</span>
                  </ProgressRing>

                  <div className="today-card-buttons">
                    {status === 'DONE' || status === 'COMPLETED_LATE' ? (
                      <Link to="/progress" className="btn">
                        View Progress
                      </Link>
                    ) : isTimedHere && timer?.status === 'running' ? (
                      <>
                        <button type="button" className="btn" onClick={() => void pauseTimer()}>
                          Pause
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => void stopTimer()}>
                          Stop
                        </button>
                      </>
                    ) : isTimedHere && timer?.status === 'paused' ? (
                      <>
                        <button type="button" className="btn btn-primary" onClick={() => void resumeTimer()}>
                          Resume
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => void stopTimer()}>
                          Stop
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void handleStart(commitment.id)}
                        disabled={anotherTimerRunning}
                        title={anotherTimerRunning ? 'Stop the active timer first' : undefined}
                      >
                        Start
                      </button>
                    )}
                    {isTimedHere && (
                      <Link to="/timer" className="btn">
                        Open Timer
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
