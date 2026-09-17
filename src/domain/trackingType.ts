// Domain logic for a commitment's tracking type (DURATION vs COMPLETION).
// Pure, framework-free, no I/O — moved out of db/repository.ts because this
// is business logic, not data access, even though the data access layer
// also needs it when creating new commitments.

import type { Commitment, TrackingType } from '../types';
import { formatHoursMinutes } from '../utils/date';

/** Commitments created before `trackingType` existed have no such field;
 *  always treat that as 'DURATION' so old data keeps working unchanged. */
export function resolveTrackingType(commitment: Commitment): TrackingType {
  return commitment.trackingType ?? 'DURATION';
}

/**
 * Short label describing how a commitment is tracked, used in list/detail
 * meta lines (e.g. "1h 30m / day" or "Completion"). Centralizes a ternary
 * that was previously duplicated across Commitments and CommitmentDetail.
 */
export function formatTrackingLabel(commitment: Commitment): string {
  return resolveTrackingType(commitment) === 'COMPLETION'
    ? 'Completion'
    : `${formatHoursMinutes(commitment.dailyTargetSeconds)} / day`;
}
