import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cappedElapsedSeconds } from '../timer/engine';
import { formatDuration, formatHoursMinutes, formatLongDate } from '../utils/date';
import ProgressRing from '../components/ProgressRing';
import { ArrowLeftIcon, CheckIcon, PauseIcon, PlayIcon, StopIcon } from '../components/icons';
import './Timer.css';

// State-based captions are drawn from the reference board's timer screens.
const CAPTIONS = {
  running: 'Deep work. Real progress.',
  paused: 'A little more discipline today.',
  done: 'Well done. Consistency builds freedom.',
} as const;

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
        <div className="panel ticked timer-empty-card">
          <span className="eyebrow">No active session</span>
          <p className="timer-empty-copy">There is no timer running right now. Start one from Today.</p>
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
  const state = isDone ? 'done' : isRunning ? 'running' : 'paused';
  const ringColor = isDone ? 'var(--color-success)' : 'var(--color-accent)';

  return (
    <div className={`timer-screen timer-state-${state}`}>
      <div className="timer-topbar">
        <button type="button" className="btn timer-back-btn" onClick={() => navigate('/today')}>
          <ArrowLeftIcon width={13} height={13} /> Today
        </button>
        <span className="timer-topbar-date label label-faint mono">{formatLongDate(timer.dayDate)}</span>
      </div>

      <div className="timer-stage">
        <div className="timer-heading">
          <span className={`timer-state-pill state-${state}`}>
            <span className="timer-state-dot" aria-hidden="true" />
            {isDone ? 'Complete' : isRunning ? 'Recording' : 'On hold'}
          </span>
          <h1 className="timer-context">{commitment.name}</h1>
        </div>

        <div className="timer-instrument">
          <ProgressRing
            percent={percent}
            size={300}
            strokeWidth={12}
            ticks={60}
            color={ringColor}
            glow={isRunning || isDone}
          >
            <span className="timer-elapsed mono" aria-live="polite">
              {formatDuration(elapsed)}
            </span>
            <span className="timer-target mono">/ {formatHoursMinutes(record.targetSeconds)}</span>
            <span className={`timer-percent-badge${isDone ? ' done' : ''}`}>
              {isDone ? (
                <>
                  <CheckIcon width={12} height={12} /> 100%
                </>
              ) : (
                `${Math.round(percent)}% complete`
              )}
            </span>
          </ProgressRing>
        </div>

        {/* Precision readouts */}
        <div className="timer-readouts panel">
          <Readout label="Elapsed" value={formatDuration(elapsed)} live={isRunning} />
          <div className="timer-readout-sep" aria-hidden="true" />
          <Readout label="Target" value={formatHoursMinutes(record.targetSeconds)} />
          <div className="timer-readout-sep" aria-hidden="true" />
          <Readout label="Remaining" value={isDone ? '—' : formatDuration(remaining)} />
        </div>

        {isDone ? (
          <div className="timer-done-actions">
            <div className="timer-done-panel panel ticked">
              <span className="timer-done-check" aria-hidden="true">
                <CheckIcon width={18} height={18} />
              </span>
              <div>
                <div className="timer-done-title">Daily Target Completed</div>
                <div className="timer-done-sub label">Capped at 100% — bonus time never over-counts.</div>
              </div>
            </div>
            <div className="timer-controls">
              <button type="button" className="btn" onClick={() => navigate('/today')}>
                Back to Today
              </button>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/progress')}>
                View Progress
              </button>
            </div>
          </div>
        ) : (
          <div className="timer-controls">
            {isRunning ? (
              <button type="button" className="btn btn-large timer-ctrl" onClick={() => void pauseTimer()}>
                <PauseIcon width={15} height={15} /> Pause
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-large timer-ctrl" onClick={() => void resumeTimer()}>
                <PlayIcon width={15} height={15} /> Resume
              </button>
            )}
            {confirmingStop ? (
              <div className="timer-stop-confirm panel">
                <span className="label">Stop and save progress?</span>
                <div className="timer-stop-confirm-actions">
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
              </div>
            ) : (
              <button type="button" className="btn btn-danger btn-large timer-ctrl" onClick={() => setConfirmingStop(true)}>
                <StopIcon width={14} height={14} /> Stop
              </button>
            )}
          </div>
        )}

        <p className="timer-caption">{CAPTIONS[state]}</p>
      </div>
    </div>
  );
}

function Readout({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div className="timer-readout">
      <span className="timer-readout-label label">{label}</span>
      <span className={`timer-readout-value mono${live ? ' live' : ''}`}>{value}</span>
    </div>
  );
}
