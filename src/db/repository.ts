// Typed data-access functions built on top of db.ts. This is the only layer
// the rest of the app should import from when it needs persisted data —
// components never talk to IndexedDB directly.

import { STORES, clearStore, getAll, getById, getByIndex, put, remove } from './db';
import type { Commitment, DayRecord, ExportPayload, Settings, TimerState } from '../types';
import { computeEndDate, enumerateDates } from '../utils/date';

// ---------- Commitments ----------

export async function listCommitments(): Promise<Commitment[]> {
  const all = await getAll<Commitment>(STORES.commitments);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCommitment(id: string): Promise<Commitment | undefined> {
  return getById<Commitment>(STORES.commitments, id);
}

export interface NewCommitmentInput {
  name: string;
  dailyTargetSeconds: number;
  durationDays: number;
  startDate: string;
}

/** Creates a commitment and generates one DayRecord for every scheduled day. */
export async function createCommitment(input: NewCommitmentInput): Promise<Commitment> {
  const endDate = computeEndDate(input.startDate, input.durationDays);
  const commitment: Commitment = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    dailyTargetSeconds: input.dailyTargetSeconds,
    durationDays: input.durationDays,
    startDate: input.startDate,
    endDate,
    createdAt: Date.now(),
  };

  await put(STORES.commitments, commitment);

  const dates = enumerateDates(input.startDate, endDate);
  for (const date of dates) {
    const record: DayRecord = {
      id: dayRecordId(commitment.id, date),
      commitmentId: commitment.id,
      date,
      targetSeconds: input.dailyTargetSeconds,
      elapsedSeconds: 0,
      status: 'NOT_STARTED',
    };
    await put(STORES.dayRecords, record);
  }

  return commitment;
}

export async function deleteCommitment(id: string): Promise<void> {
  const records = await getByIndex<DayRecord>(STORES.dayRecords, 'commitmentId', id);
  for (const record of records) {
    await remove(STORES.dayRecords, record.id);
  }
  await remove(STORES.commitments, id);
}

// ---------- Day records ----------

export function dayRecordId(commitmentId: string, date: string): string {
  return `${commitmentId}_${date}`;
}

export async function listDayRecordsForCommitment(commitmentId: string): Promise<DayRecord[]> {
  const records = await getByIndex<DayRecord>(STORES.dayRecords, 'commitmentId', commitmentId);
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDayRecord(commitmentId: string, date: string): Promise<DayRecord | undefined> {
  return getById<DayRecord>(STORES.dayRecords, dayRecordId(commitmentId, date));
}

export async function listAllDayRecords(): Promise<DayRecord[]> {
  return getAll<DayRecord>(STORES.dayRecords);
}

export async function saveDayRecord(record: DayRecord): Promise<void> {
  await put(STORES.dayRecords, record);
}

// ---------- Timer ----------

const TIMER_KEY = 'current';

export async function getTimerState(): Promise<TimerState | undefined> {
  return getById<TimerState>(STORES.timerState, TIMER_KEY);
}

export async function saveTimerState(state: TimerState): Promise<void> {
  await put(STORES.timerState, state);
}

export async function clearTimerState(): Promise<void> {
  await remove(STORES.timerState, TIMER_KEY);
}

// ---------- Settings ----------

const SETTINGS_KEY = 'app';

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_KEY,
  // Daylight is the primary Aqua Lens identity; Deep is the dark alternative.
  theme: 'light',
  notificationsEnabled: false,
  hasOnboarded: false,
};

export async function getSettings(): Promise<Settings> {
  const existing = await getById<Settings>(STORES.settings, SETTINGS_KEY);
  return existing ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await put(STORES.settings, settings);
}

// ---------- Export / import / reset ----------

export async function exportAllData(): Promise<ExportPayload> {
  const [commitments, dayRecords, timerState, settings] = await Promise.all([
    listCommitments(),
    listAllDayRecords(),
    getTimerState(),
    getSettings(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    commitments,
    dayRecords,
    timerState: timerState ?? null,
    settings,
  };
}

/** Validates and imports an export payload, replacing existing data. */
export async function importAllData(payload: unknown): Promise<void> {
  if (!isExportPayload(payload)) {
    throw new Error('This file is not a valid GRIT export.');
  }

  await clearStore(STORES.commitments);
  await clearStore(STORES.dayRecords);
  await clearStore(STORES.timerState);

  for (const commitment of payload.commitments) {
    await put(STORES.commitments, commitment);
  }
  for (const record of payload.dayRecords) {
    await put(STORES.dayRecords, record);
  }
  if (payload.timerState) {
    await put(STORES.timerState, payload.timerState);
  }
  if (payload.settings) {
    await put(STORES.settings, payload.settings);
  }
}

function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.commitments) &&
    Array.isArray(v.dayRecords)
  );
}

/** Permanently deletes all commitments, day records, and timer state.
 *  Settings (theme, notification pref) are preserved by design. */
export async function resetAllData(): Promise<void> {
  await clearStore(STORES.commitments);
  await clearStore(STORES.dayRecords);
  await clearStore(STORES.timerState);
}
