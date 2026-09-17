import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { computeEndDate, formatLongDate, todayISO } from '../utils/date';
import './NewCommitment.css';

interface FormErrors {
  name?: string;
  hours?: string;
  minutes?: string;
  duration?: string;
  startDate?: string;
}

export default function NewCommitment() {
  const { createCommitment } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [duration, setDuration] = useState('30');
  const [startDate, setStartDate] = useState(todayISO());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hoursNum = Number(hours);
  const minutesNum = Number(minutes);
  const durationNum = Number(duration);
  const dailyTargetSeconds = (hoursNum || 0) * 3600 + (minutesNum || 0) * 60;
  const previewEndDate =
    startDate && durationNum > 0 ? computeEndDate(startDate, durationNum) : null;

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Commitment name is required.';
    if (!hours && !minutes) next.hours = 'Daily target is required.';
    if (hoursNum < 0 || minutesNum < 0 || minutesNum > 59) next.minutes = 'Enter a valid duration.';
    if (dailyTargetSeconds <= 0) next.hours = 'Daily target must be greater than zero.';
    if (!duration || durationNum < 1 || !Number.isInteger(durationNum)) {
      next.duration = 'Duration must be a whole number of at least 1 day.';
    }
    if (!startDate) next.startDate = 'Start date is required.';
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const commitment = await createCommitment({
        name: name.trim(),
        dailyTargetSeconds,
        durationDays: durationNum,
        startDate,
      });
      navigate(`/commitments/${commitment.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create the commitment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="new-commitment-screen">
      <h1 className="new-commitment-title">New Commitment</h1>

      <form className="panel new-commitment-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="name">
            Commitment Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Study Electronics"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" className="field-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="hours">
            Daily Target
          </label>
          <div className="new-commitment-duration-row">
            <select id="hours" value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Hours">
              {Array.from({ length: 13 }, (_, i) => i).map((h) => (
                <option key={h} value={h}>
                  {h} hr
                </option>
              ))}
            </select>
            <select value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutes">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          {(errors.hours || errors.minutes) && (
            <span className="field-error">{errors.hours ?? errors.minutes}</span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="duration">
            Duration (days)
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            step={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-invalid={!!errors.duration}
            aria-describedby={errors.duration ? 'duration-error' : undefined}
          />
          {errors.duration && (
            <span id="duration-error" className="field-error">
              {errors.duration}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="startDate">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'start-error' : undefined}
          />
          {errors.startDate && (
            <span id="start-error" className="field-error">
              {errors.startDate}
            </span>
          )}
        </div>

        {previewEndDate && (
          <div className="new-commitment-preview label">
            Scheduled {formatLongDate(startDate)} {'->'} {formatLongDate(previewEndDate)}
          </div>
        )}

        {submitError && <div className="field-error">{submitError}</div>}

        <div className="new-commitment-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Start Commitment'}
          </button>
        </div>
      </form>
    </div>
  );
}
