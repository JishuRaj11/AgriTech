export default function StatCard({ label, value, icon, color = 'success', help }) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <span className={`stat-icon bg-${color}-subtle text-${color}-emphasis`} aria-hidden="true">
          {icon}
        </span>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {help && <small className="text-muted">{help}</small>}
        </div>
      </div>
    </div>
  );
}
