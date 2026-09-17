// Typed data-access functions for Commitments. Part of the repository layer
// — components never talk to IndexedDB directly, they go through here (or
// the sibling *.repo.ts files) via the db/repository.ts barrel.

import { STORES, getAll, getByIndex, getById, put, remove } from './db';
import type { Commitment, DayRecord, TrackingType } from '../types';
import { computeEndDate, enumerateDates } from '../utils/date';

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
  /** Defaults to 'DURATION' when omitted, to keep existing callers/tests working. */
  trackingType?: TrackingType;
}

/** Creates a commitment and generates one DayRecord for every scheduled day. */
export async function createCommitment(input: NewCommitmentInput): Promise<Commitment> {
  const endDate = computeEndDate(input.startDate, input.durationDays);
  const trackingType = input.trackingType ?? 'DURATION';
  // Completion habits have no timer target — force this to 0 regardless of
  // what was passed in, so history/progress math never sees stray seconds.
  const dailyTargetSeconds = trackingType === 'COMPLETION' ? 0 : input.dailyTargetSeconds;
  const commitment: Commitment = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    dailyTargetSeconds,
    durationDays: input.durationDays,
    trackingType,
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
      targetSeconds: dailyTargetSeconds,
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

/** `${commitmentId}_${date}` — the deterministic id for a commitment+day. */
export function dayRecordId(commitmentId: string, date: string): string {
  return `${commitmentId}_${date}`;
}
