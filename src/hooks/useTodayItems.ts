// Builds today's list of TodayItems from the app's commitments + records +
// timer state. Extracted from screens/Today.tsx's inline useMemo verbatim
// (same filtering/derivation), so the screen component stays presentation-
// only and this logic is reusable/testable on its own.

import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { deriveTodayItem, type TodayItem } from '../domain/habit';
import { todayISO } from '../utils/date';

export function useTodayItems(): TodayItem[] {
  const { commitments, dayRecordFor, timer, nowMs } = useApp();
  const today = todayISO();

  return useMemo<TodayItem[]>(() => {
    return commitments
      .filter((c) => c.startDate <= today && today <= c.endDate)
      .map((c) => {
        const record = dayRecordFor(c.id, today);
        if (!record) return null;
        return deriveTodayItem(c, record, today, timer, nowMs);
      })
      .filter((v): v is TodayItem => v !== null);
  }, [commitments, dayRecordFor, today, timer, nowMs]);
}
