import { describe, expect, it } from 'vitest';
import { computeDisplayStatus } from './status';
import type { DayRecord, TimerState } from '../types';
import { addDays, todayISO } from './date';

function record(overrides: Partial<DayRecord>): DayRecord {
  return {
    id: 'r',
    commitmentId: 'c1',
    date: todayISO(),
    targetSeconds: 3600,
    elapsedSeconds: 0,
    status: 'NOT_STARTED',
    ...overrides,
  };
}

describe('computeDisplayStatus', () => {
  it('marks a past, untouched day as MISSED', () => {
    const r = record({ date: addDays(todayISO(), -1), status: 'NOT_STARTED', elapsedSeconds: 0 });
    expect(computeDisplayStatus(r)).toBe('MISSED');
  });

  it('marks a past day with partial time but not DONE as MISSED (day is over)', () => {
    const r = record({ date: addDays(todayISO(), -1), status: 'PARTIAL', elapsedSeconds: 600 });
    expect(computeDisplayStatus(r)).toBe('MISSED');
  });

  it('marks a future day as NOT_STARTED', () => {
    const r = record({ date: addDays(todayISO(), 2), status: 'NOT_STARTED', elapsedSeconds: 0 });
    expect(computeDisplayStatus(r)).toBe('NOT_STARTED');
  });

  it("marks today's untouched day as NOT_STARTED", () => {
    const r = record({ date: todayISO(), status: 'NOT_STARTED', elapsedSeconds: 0 });
    expect(computeDisplayStatus(r)).toBe('NOT_STARTED');
  });

  it("marks today's day with partial progress as PARTIAL when no timer is active", () => {
    const r = record({ date: todayISO(), status: 'NOT_STARTED', elapsedSeconds: 300 });
    expect(computeDisplayStatus(r)).toBe('PARTIAL');
  });

  it('marks the record as IN_PROGRESS while its timer is actively running', () => {
    const r = record({ date: todayISO() });
    const timer: TimerState = {
      id: 'current',
      commitmentId: 'c1',
      dayDate: todayISO(),
      status: 'running',
      baselineSeconds: 0,
      accumulatedSeconds: 0,
      runStartedAt: Date.now(),
    };
    expect(computeDisplayStatus(r, timer)).toBe('IN_PROGRESS');
  });

  it('marks a DONE record completed on its scheduled date as DONE', () => {
    const today = todayISO();
    const now = Date.now();
    const r = record({ date: today, status: 'DONE', elapsedSeconds: 3600, completedAt: now });
    expect(computeDisplayStatus(r)).toBe('DONE');
  });

  it('marks a DONE record completed after its scheduled date as COMPLETED_LATE, preserving the original date', () => {
    const scheduledDate = addDays(todayISO(), -3);
    const r = record({ date: scheduledDate, status: 'DONE', elapsedSeconds: 3600, completedAt: Date.now() });
    expect(computeDisplayStatus(r)).toBe('COMPLETED_LATE');
    // The scheduled date itself must never move.
    expect(r.date).toBe(scheduledDate);
  });
});
