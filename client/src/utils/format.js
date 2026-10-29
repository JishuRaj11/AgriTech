export const formatDate = (value, locale = 'en-IN') => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (value, locale = 'en-IN') => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export const toInputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export const statusColor = (status) => {
  const map = {
    pending: 'warning',
    approved: 'info',
    delivered: 'success',
    rejected: 'danger',
    cancelled: 'secondary',
    planned: 'secondary',
    growing: 'success',
    harvested: 'primary',
    failed: 'danger',
    open: 'warning',
    answered: 'success',
    closed: 'secondary',
    low: 'success',
    medium: 'warning',
    high: 'danger',
    poor: 'danger',
    fair: 'warning',
    good: 'info',
    excellent: 'success'
  };
  return map[status] || 'secondary';
};
