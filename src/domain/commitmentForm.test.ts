import { describe, expect, it } from 'vitest';
import { validateCommitmentForm, type CommitmentFormValues } from './commitmentForm';

function values(overrides: Partial<CommitmentFormValues>): CommitmentFormValues {
  return {
    name: 'Study',
    trackingType: 'DURATION',
    hours: '1',
    minutes: '0',
    duration: '30',
    startDate: '2026-01-01',
    ...overrides,
  };
}

describe('validateCommitmentForm', () => {
  it('passes for a valid DURATION form', () => {
    expect(validateCommitmentForm(values({}))).toEqual({});
  });

  it('requires a name', () => {
    expect(validateCommitmentForm(values({ name: '  ' })).name).toBeDefined();
  });

  it('requires a nonzero daily target for DURATION commitments', () => {
    const errors = validateCommitmentForm(values({ hours: '0', minutes: '0' }));
    expect(errors.hours).toBeDefined();
  });

  it('skips the daily-target requirement entirely for COMPLETION commitments', () => {
    const errors = validateCommitmentForm(values({ trackingType: 'COMPLETION', hours: '0', minutes: '0' }));
    expect(errors.hours).toBeUndefined();
    expect(errors.minutes).toBeUndefined();
  });

  it('rejects an out-of-range minutes value', () => {
    expect(validateCommitmentForm(values({ minutes: '60' })).minutes).toBeDefined();
  });

  it('requires a whole-number duration of at least 1 day', () => {
    expect(validateCommitmentForm(values({ duration: '0' })).duration).toBeDefined();
    expect(validateCommitmentForm(values({ duration: '2.5' })).duration).toBeDefined();
  });

  it('requires a start date', () => {
    expect(validateCommitmentForm(values({ startDate: '' })).startDate).toBeDefined();
  });
});
