import { statusColor } from '../utils/format';

export default function StatusBadge({ status, label }) {
  return (
    <span className={`badge status-badge bg-${statusColor(status)}-subtle text-${statusColor(status)}-emphasis`}>
      {label || status}
    </span>
  );
}
