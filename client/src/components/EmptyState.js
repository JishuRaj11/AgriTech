export default function EmptyState({ message, icon = '🌾' }) {
  return (
    <div className="text-center text-muted py-5">
      <div style={{ fontSize: '2.5rem' }} aria-hidden="true">
        {icon}
      </div>
      <p className="mb-0 mt-2">{message}</p>
    </div>
  );
}
