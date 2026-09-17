import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDuration, formatHoursMinutes, formatLongDate, formatShortDate, parseISODate, toISODate } from '../utils/date';
import { summarizeProgress } from '../utils/progress';
import { computeDisplayStatus } from '../utils/status';
import { resolveTrackingType } from '../db/repository';
import StatusBadge from '../components/StatusBadge';
import FocusLens from '../components/FocusLens';
import { ArrowLeftIcon } from '../components/icons';
import type { DayRecord, DisplayStatus } from '../types';
import './CommitmentDetail.css';

const STATUS_DOT_CLASS: Record<DisplayStatus, string> = {
  NOT_STARTED: 'cal-neutral',
  IN_PROGRESS: 'cal-accent',
  PARTIAL: 'cal-warning',
  DONE: 'cal-success',
  COMPLETED_LATE: 'cal-late',
  MISSED: 'cal-danger',
};

export default function CommitmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commitments, dayRecordsFor, timer, deleteCommitment } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const commitment = commitments.find((c) => c.id === id);
  const records = useMemo(() => (id ? dayRecordsFor(id) : []), [id, dayRecordsFor]);
  const summary = useMemo(() => summarizeProgress(records), [records]);

  if (!commitment) {
    return (
      <div className="lens commitment-detail-missing">
        <p>This commitment could not be found.</p>
        <Link to="/commitments" className="btn btn-primary">
          Back to Commitments
        </Link>
      </div>
    );
  }

  const weeks = groupByWeek(records);
  const selectedRecord = selectedDate ? records.find((r) => r.date === selectedDate) : undefined;
  const commitmentId = commitment.id;
  const trackingType = resolveTrackingType(commitment);
  const isCompletion = trackingType === 'COMPLETION';

  async function handleDelete() {
    await deleteCommitment(commitmentId);
    navigate('/commitments');
  }

  return (
    <div className="commitment-detail-screen">
      <Link to="/commitments" className="commitment-detail-back">
        <ArrowLeftIcon width={13} height={13} /> Commitments
      </Link>

      <header className="commitment-detail-header">
        <div className="commitment-detail-head-lead">
          <span className="eyebrow">Commitment</span>
          <h1 className="commitment-detail-title display">{commitment.name}</h1>
          <p className="commitment-detail-meta">
            {isCompletion ? 'Completion' : `${formatHoursMinutes(commitment.dailyTargetSeconds)} / day`} ·{' '}
            {commitment.durationDays} days · {formatShortDate(commitment.startDate)} – {formatShortDate(commitment.endDate)}
          </p>
        </div>
        <FocusLens percent={summary.completionPercent} size={96} variant="round" state={summary.completionPercent === 100 ? 'done' : 'idle'}>
          <span className="commitment-detail-percent">{summary.completionPercent}%</span>
        </FocusLens>
      </header>

      <div className="commitment-detail-grid">
        <section className="lens commitment-detail-calendar">
          <div className="lens-head">
            <h2 className="label">History</h2>
            <span className="label">
              {summary.completedDays} / {summary.totalPlanned} days
            </span>
          </div>
          <div className="commitment-calendar-body">
            <div className="commitment-calendar-weekdays">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="commitment-calendar-week">
                {week.map((record, di) =>
                  record ? (
                    <button
                      key={record.date}
                      type="button"
                      className={`commitment-calendar-day ${STATUS_DOT_CLASS[computeDisplayStatus(record, timer)]}${
                        selectedDate === record.date ? ' selected' : ''
                      }`}
                      onClick={() => setSelectedDate(record.date)}
                      aria-label={`${formatLongDate(record.date)}: ${computeDisplayStatus(record, timer)}`}
                    >
                      {parseISODate(record.date).getDate()}
                    </button>
                  ) : (
                    <span key={di} className="commitment-calendar-day empty" aria-hidden="true" />
                  ),
                )}
              </div>
            ))}
          </div>
          <Legend />
        </section>

        <section className="lens commitment-detail-day">
          <div className="lens-head">
            <h2 className="label">Day detail</h2>
          </div>
          {selectedRecord ? (
            <DayDetail record={selectedRecord} isCompletion={isCompletion} />
          ) : (
            <p className="commitment-detail-day-empty">Select a droplet in the history to read its record.</p>
          )}
        </section>
      </div>

      <section className="commitment-detail-danger">
        {confirmingDelete ? (
          <div className="lens commitment-delete-confirm">
            <span>Delete this commitment and all its history? This cannot be undone.</span>
            <div className="commitment-delete-actions">
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete permanently
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
            Delete commitment
          </button>
        )}
      </section>
    </div>
  );
}

function DayDetail({ record, isCompletion }: { record: DayRecord; isCompletion: boolean }) {
  const { timer } = useApp();
  const status = computeDisplayStatus(record, timer);
  return (
    <div className="day-detail-body">
      <p className="day-detail-date serif">{formatLongDate(record.date)}</p>
      <StatusBadge status={status} />
      {!isCompletion && (
        <>
          <div className="day-detail-row">
            <span className="label">Target</span> <span className="mono">{formatHoursMinutes(record.targetSeconds)}</span>
          </div>
          <div className="day-detail-row">
            <span className="label">Recorded</span> <span className="mono">{formatDuration(record.elapsedSeconds)}</span>
          </div>
        </>
      )}
      {record.completedAt && (
        <div className="day-detail-row">
          <span className="label">Completed</span> <span className="mono">{toISODate(new Date(record.completedAt))}</span>
        </div>
      )}
      {status === 'COMPLETED_LATE' && (
        <p className="day-detail-note">
          Originally scheduled for {formatShortDate(record.date)}. This day was not completed on time and
          cannot be marked as completed on schedule.
        </p>
      )}
    </div>
  );
}

function Legend() {
  const items: { cls: string; label: string }[] = [
    { cls: 'cal-neutral', label: 'Not started' },
    { cls: 'cal-warning', label: 'Partial' },
    { cls: 'cal-danger', label: 'Missed' },
    { cls: 'cal-success', label: 'Done' },
  ];
  return (
    <div className="commitment-calendar-legend">
      {items.map((item) => (
        <span key={item.label} className="commitment-calendar-legend-item">
          <span className={`commitment-calendar-legend-dot ${item.cls}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Groups records into calendar weeks (Sun-Sat), padding leading gaps. */
function groupByWeek(records: DayRecord[]): (DayRecord | null)[][] {
  if (records.length === 0) return [];
  const weeks: (DayRecord | null)[][] = [];
  let currentWeek: (DayRecord | null)[] = [];

  const firstDow = parseISODate(records[0].date).getDay();
  for (let i = 0; i < firstDow; i++) currentWeek.push(null);

  for (const record of records) {
    currentWeek.push(record);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}
