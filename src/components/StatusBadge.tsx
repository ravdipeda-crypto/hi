import type { DisplayStatus } from '../types';
import { STATUS_LABELS } from '../utils/status';
import './StatusBadge.css';

const STATUS_CLASS: Record<DisplayStatus, string> = {
  NOT_STARTED: 'status-neutral',
  IN_PROGRESS: 'status-accent',
  PARTIAL: 'status-warning',
  DONE: 'status-success',
  COMPLETED_LATE: 'status-success',
  MISSED: 'status-danger',
};

export default function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status]}`}>
      <span className="status-dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
