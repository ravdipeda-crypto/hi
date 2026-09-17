// New-commitment form validation. Pure, framework-free — moved out of
// screens/NewCommitment.tsx's inline validate() function verbatim (same
// rules, same messages) so it's testable without mounting the form.

import type { TrackingType } from '../types';

export interface CommitmentFormValues {
  name: string;
  trackingType: TrackingType;
  hours: string;
  minutes: string;
  duration: string;
  startDate: string;
}

export interface CommitmentFormErrors {
  name?: string;
  hours?: string;
  minutes?: string;
  duration?: string;
  startDate?: string;
}

export function validateCommitmentForm(values: CommitmentFormValues): CommitmentFormErrors {
  const { name, trackingType, hours, minutes, duration, startDate } = values;
  const isCompletion = trackingType === 'COMPLETION';
  const hoursNum = Number(hours);
  const minutesNum = Number(minutes);
  const durationNum = Number(duration);
  const dailyTargetSeconds = isCompletion ? 0 : (hoursNum || 0) * 3600 + (minutesNum || 0) * 60;

  const next: CommitmentFormErrors = {};
  if (!name.trim()) next.name = 'Commitment name is required.';
  if (!isCompletion) {
    if (!hours && !minutes) next.hours = 'Daily target is required.';
    if (hoursNum < 0 || minutesNum < 0 || minutesNum > 59) next.minutes = 'Enter a valid duration.';
    if (dailyTargetSeconds <= 0) next.hours = 'Daily target must be greater than zero.';
  }
  if (!duration || durationNum < 1 || !Number.isInteger(durationNum)) {
    next.duration = 'Duration must be a whole number of at least 1 day.';
  }
  if (!startDate) next.startDate = 'Start date is required.';
  return next;
}
