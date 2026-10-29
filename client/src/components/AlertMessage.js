export default function AlertMessage({ variant = 'success', children, onClose }) {
  if (!children) return null;

  return (
    <div className={`alert alert-${variant} d-flex justify-content-between align-items-start`} role="alert">
      <span className="break-word">{children}</span>
      {onClose && (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      )}
    </div>
  );
}
