// Derives a rich, presentation-only DisplayStatus from the persisted
// DayRecordStatus plus context (today's date, whether a timer is currently
// running against this record). Nothing here is written back to storage —
// history stays append-only and factual.

import type { DayRecord, DisplayStatus, TimerState } from '../types';
import { isPast, toISODate } from './date';

export function computeDisplayStatus(
  record: DayRecord,
  activeTimer?: TimerState | null,
): DisplayStatus {
  const isThisRecordTimed =
    !!activeTimer &&
    activeTimer.commitmentId === record.commitmentId &&
    activeTimer.dayDate === record.date;

  if (record.status === 'DONE') {
    if (record.completedAt) {
      const completedDate = toISODate(new Date(record.completedAt));
      if (completedDate > record.date) return 'COMPLETED_LATE';
    }
    return 'DONE';
  }

  if (isThisRecordTimed && activeTimer!.status === 'running') {
    return 'IN_PROGRESS';
  }

  const dayIsOver = isPast(record.date);

  if (record.elapsedSeconds > 0) {
    return dayIsOver ? 'MISSED' : 'PARTIAL';
  }

  return dayIsOver ? 'MISSED' : 'NOT_STARTED';
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  NOT_STARTED: 'NOT STARTED',
  IN_PROGRESS: 'IN PROGRESS',
  PARTIAL: 'PARTIAL',
  DONE: 'DONE',
  COMPLETED_LATE: 'COMPLETED LATE',
  MISSED: 'MISSED',
};
