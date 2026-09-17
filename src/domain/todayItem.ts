// Derives everything a Today/Timer card needs to render from a Commitment +
// its DayRecord + the active timer (if any). Pure and framework-free so it
// can be unit tested and reused without a component tree — moved out of
// screens/Today.tsx's inline useMemo body verbatim (same formulas).

import type { Commitment, DayRecord, DisplayStatus, TimerState, TrackingType } from '../types';
import { cappedElapsedSeconds } from '../timer/engine';
import { computeDisplayStatus } from './status';
import { resolveTrackingType } from './trackingType';

export interface TodayItem {
  commitment: Commitment;
  trackingType: TrackingType;
  record: DayRecord;
  status: DisplayStatus;
  liveElapsed: number;
  remaining: number;
  percent: number;
  isTimedHere: boolean;
}

/**
 * Builds a `TodayItem` for a single commitment + its record for `date`.
 * `nowMs` drives live elapsed-time math while a timer is actively running
 * against this exact commitment/day; otherwise the record's persisted
 * `elapsedSeconds` is used as-is. `nowMs` is passed in (rather than read
 * via `Date.now()` internally) so this stays a pure function of its inputs
 * — callers re-derive it whenever their own `nowMs` state ticks.
 */
export function deriveTodayItem(
  commitment: Commitment,
  record: DayRecord,
  date: string,
  timer: TimerState | null | undefined,
  nowMs: number,
): TodayItem {
  const trackingType = resolveTrackingType(commitment);
  const isTimedHere = timer?.commitmentId === commitment.id && timer.dayDate === date;
  const liveElapsed = isTimedHere && timer
    ? cappedElapsedSeconds(timer, record.targetSeconds, nowMs)
    : record.elapsedSeconds;
  const remaining = Math.max(0, record.targetSeconds - liveElapsed);
  const percent =
    trackingType === 'COMPLETION'
      ? record.status === 'DONE' ? 100 : 0
      : record.targetSeconds > 0 ? Math.min(100, (liveElapsed / record.targetSeconds) * 100) : 0;

  return {
    commitment,
    trackingType,
    record,
    status: computeDisplayStatus(record, timer),
    liveElapsed,
    remaining,
    percent,
    isTimedHere,
  };
}
