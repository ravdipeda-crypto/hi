import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cappedElapsedSeconds } from '../timer/engine';
import { formatDuration, formatHoursMinutes } from '../utils/date';
import ProgressRing from '../components/ProgressRing';
import { CheckIcon } from '../components/icons';
import './Timer.css';

export default function Timer() {
  const { timer, commitments, dayRecordFor, nowMs, pauseTimer, resumeTimer, stopTimer } = useApp();
  const navigate = useNavigate();
  const [confirmingStop, setConfirmingStop] = useState(false);

  const commitment = useMemo(
    () => (timer ? commitments.find((c) => c.id === timer.commitmentId) : undefined),
    [timer, commitments],
  );
  const record = timer ? dayRecordFor(timer.commitmentId, timer.dayDate) : undefined;

  if (!timer || !commitment || !record) {
    return (
      <div className="timer-screen timer-empty">
        <div className="panel timer-empty-card">
          <p>No timer is currently running.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/today')}>
            Go to Today
          </button>
        </div>
      </div>
    );
  }

  const elapsed = cappedElapsedSeconds(timer, record.targetSeconds, nowMs);
  const remaining = Math.max(0, record.targetSeconds - elapsed);
  const percent = record.targetSeconds > 0 ? Math.min(100, (elapsed / record.targetSeconds) * 100) : 0;
  const isRunning = timer.status === 'running';
  const isDone = record.status === 'DONE';

  return (
    <div className="timer-screen">
      <p className="label timer-context">{commitment.name}</p>
      <p className="timer-subcontext">
        {isDone ? 'Daily target completed' : isRunning ? 'Running' : 'Paused'}
      </p>

      <div className="timer-ring-wrap">
        <ProgressRing percent={percent} size={260} strokeWidth={10} color={isDone ? 'var(--color-success)' : 'var(--color-accent)'}>
          <span className="timer-elapsed mono">{formatDuration(elapsed)}</span>
          <span className="label timer-target">/ {formatHoursMinutes(record.targetSeconds)}</span>
          <span className="timer-percent mono">{Math.round(percent)}% complete</span>
        </ProgressRing>
      </div>

      <p className="timer-remaining label">
        {isDone ? 'Target reached — capped at 100%' : `${formatDuration(remaining)} remaining`}
      </p>

      {isDone ? (
        <div className="timer-done-panel panel">
          <span className="timer-done-check">
            <CheckIcon width={18} height={18} />
          </span>
          <div>
            <div className="timer-done-title">Daily Target Completed</div>
            <div className="timer-done-sub label">Consistency compounds over time.</div>
          </div>
        </div>
      ) : (
        <div className="timer-controls">
          {isRunning ? (
            <button type="button" className="btn btn-large" onClick={() => void pauseTimer()}>
              Pause
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-large" onClick={() => void resumeTimer()}>
              Resume
            </button>
          )}
          {confirmingStop ? (
            <div className="timer-stop-confirm">
              <span className="label">Stop and save progress?</span>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  void stopTimer();
                  setConfirmingStop(false);
                }}
              >
                Confirm Stop
              </button>
              <button type="button" className="btn" onClick={() => setConfirmingStop(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-danger btn-large" onClick={() => setConfirmingStop(true)}>
              Stop
            </button>
          )}
        </div>
      )}

      <button type="button" className="btn timer-back" onClick={() => navigate('/today')}>
        Back to Today
      </button>
    </div>
  );
}
